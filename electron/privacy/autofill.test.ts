import { describe, expect, it } from 'vitest';
import { canFillFor, httpOrigin, withoutHash } from './autofill';

describe('canFillFor', () => {
  const saved = 'https://accounts.example.com';

  it('fills the exact origin in the top frame', () => {
    expect(canFillFor('https://accounts.example.com/login?next=/', saved, true)).toBe(true);
  });

  it('never fills a subframe', () => {
    expect(canFillFor('https://accounts.example.com/login', saved, false)).toBe(false);
  });

  it('rejects other hosts, subdomains, schemes and ports', () => {
    for (const url of [
      'https://example.com/', 'https://evil.accounts.example.com/', 'https://accounts.example.com.evil.test/',
      'http://accounts.example.com/', 'https://accounts.example.com:8443/', 'https://accounts-example.com/',
    ]) expect(canFillFor(url, saved, true), url).toBe(false);
  });

  it('rejects non-web pages', () => {
    for (const url of ['tekeli://settings', 'file:///c:/a.html', 'about:blank', 'not a url', '']) expect(canFillFor(url, saved, true), url).toBe(false);
  });
});

describe('helpers', () => {
  it('httpOrigin only accepts http(s)', () => {
    expect(httpOrigin('https://a.test:444/x')).toBe('https://a.test:444');
    expect(httpOrigin('ftp://a.test')).toBeNull();
  });

  it('withoutHash drops only the fragment', () => {
    expect(withoutHash('https://a.test/p?q=1#top')).toBe('https://a.test/p?q=1');
    expect(withoutHash('https://a.test/p')).toBe('https://a.test/p');
  });
});
