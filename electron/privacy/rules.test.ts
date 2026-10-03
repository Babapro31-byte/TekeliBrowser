import { describe, expect, it } from 'vitest';
import { filterSetCookie, isThirdParty, shouldUpgradeToHttps, siteOf, stripCookieHeader, stripTrackingParams, upgradeUrl } from './rules';

describe('stripTrackingParams', () => {
  it('removes known tracking params and keeps functional ones', () => {
    expect(stripTrackingParams('https://a.com/p?utm_source=x&id=7&fbclid=abc&ref=home')).toBe('https://a.com/p?id=7&ref=home');
  });
  it('returns null when nothing to strip', () => {
    expect(stripTrackingParams('https://a.com/p?id=7&source=mail')).toBeNull();
    expect(stripTrackingParams('https://a.com/')).toBeNull();
  });
  it('never touches non-http urls', () => {
    expect(stripTrackingParams('tekeli://settings?utm_x=1')).toBeNull();
  });
  it('drops the ? when every param was tracking', () => {
    expect(stripTrackingParams('https://a.com/x?gclid=1&utm_medium=2')).toBe('https://a.com/x');
  });
});

describe('site identity', () => {
  it('uses registrable domains, not the last two labels', () => {
    expect(siteOf('https://www.bbc.co.uk/news')).toBe('bbc.co.uk');
    expect(siteOf('https://a.github.io/x')).toBe('a.github.io');
    expect(siteOf('https://b.github.io/x')).toBe('b.github.io');
    expect(siteOf('https://cdn.example.com')).toBe('example.com');
  });
  it('treats distinct github.io sites as third parties of each other', () => {
    expect(isThirdParty('https://evil.github.io/t.js', 'https://good.github.io/')).toBe(true);
    expect(isThirdParty('https://static.example.com/a.js', 'https://www.example.com/')).toBe(false);
    expect(isThirdParty('https://tracker.net/p', 'https://example.com/')).toBe(true);
  });
  it('is first-party when there is no top url', () => {
    expect(isThirdParty('https://x.com', undefined)).toBe(false);
    expect(isThirdParty('https://x.com', 'tekeli://newtab')).toBe(false);
  });
});

describe('https upgrade', () => {
  const on = { enabled: true, allowlist: [] as string[] };
  it('upgrades public http hosts on the default port', () => {
    expect(shouldUpgradeToHttps('http://example.com/a', on)).toBe(true);
    expect(upgradeUrl('http://example.com/a?x=1')).toBe('https://example.com/a?x=1');
  });
  it('skips local hosts, odd ports, https and disabled mode', () => {
    expect(shouldUpgradeToHttps('http://localhost:5173/', on)).toBe(false);
    expect(shouldUpgradeToHttps('http://192.168.1.10/', on)).toBe(false);
    expect(shouldUpgradeToHttps('http://example.com:8080/', on)).toBe(false);
    expect(shouldUpgradeToHttps('https://example.com/', on)).toBe(false);
    expect(shouldUpgradeToHttps('http://example.com/', { ...on, enabled: false })).toBe(false);
  });
  it('honors the user exception list including subdomains', () => {
    const al = { enabled: true, allowlist: ['legacy.test'] };
    expect(shouldUpgradeToHttps('http://legacy.test/', al)).toBe(false);
    expect(shouldUpgradeToHttps('http://sub.legacy.test/', al)).toBe(false);
    expect(shouldUpgradeToHttps('http://notlegacy.test/', al)).toBe(true);
  });
});

describe('cookie filtering', () => {
  const h = { 'set-cookie': ['a=1'], 'Content-Type': ['text/html'] };
  it('drops set-cookie regardless of casing, third-party only by default', () => {
    expect(filterSetCookie(h, 'block-third-party', true)).toEqual({ 'Content-Type': ['text/html'] });
    expect(filterSetCookie({ 'Set-Cookie': ['a=1'] }, 'block-third-party', true)).toEqual({});
    expect(filterSetCookie(h, 'block-third-party', false)).toBeNull();
  });
  it('block-all drops everywhere; all keeps everything', () => {
    expect(filterSetCookie(h, 'block-all', false)).not.toBeNull();
    expect(filterSetCookie(h, 'all', true)).toBeNull();
  });
  it('strips the Cookie request header under the same rules', () => {
    expect(stripCookieHeader({ Cookie: 'a=1', Accept: '*/*' }, 'block-third-party', true)).toEqual({ Accept: '*/*' });
    expect(stripCookieHeader({ cookie: 'a=1' }, 'block-third-party', false)).toBeNull();
  });
});
