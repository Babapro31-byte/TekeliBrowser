import { describe, expect, it } from 'vitest';
import { buildSearchUrl, displayUrl, internalPageOf, isLocalHost, resolveInput } from './url';

describe('resolveInput', () => {
  it('upgrades bare hosts to https', () => {
    expect(resolveInput('github.com', 'duckduckgo')).toBe('https://github.com');
    expect(resolveInput('github.com/a/b?x=1', 'duckduckgo')).toBe('https://github.com/a/b?x=1');
  });

  it('keeps http for local/LAN hosts', () => {
    expect(resolveInput('localhost:5173', 'duckduckgo')).toBe('http://localhost:5173');
    expect(resolveInput('192.168.1.1', 'duckduckgo')).toBe('http://192.168.1.1');
    expect(resolveInput('myapp.local/x', 'duckduckgo')).toBe('http://myapp.local/x');
  });

  it('turns free text into a search', () => {
    expect(resolveInput('hava durumu', 'google')).toBe('https://www.google.com/search?q=hava%20durumu');
    expect(resolveInput('electron', 'bing')).toBe('https://www.bing.com/search?q=electron');
  });

  it('passes explicit schemes and internal pages through', () => {
    expect(resolveInput('http://example.com', 'duckduckgo')).toBe('http://example.com');
    expect(resolveInput('tekeli://settings/privacy', 'duckduckgo')).toBe('tekeli://settings/privacy');
    expect(resolveInput('view-source:https://a.com', 'duckduckgo')).toBe('view-source:https://a.com');
  });

  it('never navigates javascript:/data:/file: from the omnibox', () => {
    expect(resolveInput('javascript:alert(1)', 'duckduckgo')).toContain('duckduckgo.com/?q=');
    expect(resolveInput('data:text/html,hi', 'duckduckgo')).toContain('duckduckgo.com/?q=');
    expect(resolveInput('file:///C:/x', 'duckduckgo')).toContain('duckduckgo.com/?q=');
  });

  it('returns empty for blank input', () => {
    expect(resolveInput('   ', 'duckduckgo')).toBe('');
  });
});

describe('isLocalHost', () => {
  it('recognizes private ranges and rejects public ones', () => {
    for (const h of ['localhost', '127.0.0.1', '10.0.0.5', '172.16.4.2', '172.31.0.1', '192.168.0.9', '169.254.1.1', 'a.localhost', 'x.local']) {
      expect(isLocalHost(h)).toBe(true);
    }
    for (const h of ['8.8.8.8', '172.32.0.1', '172.15.0.1', 'example.com', 'local.example.com']) {
      expect(isLocalHost(h)).toBe(false);
    }
  });
});

describe('internalPageOf / displayUrl / buildSearchUrl', () => {
  it('detects internal pages', () => {
    expect(internalPageOf('tekeli://settings/privacy')).toBe('settings');
    expect(internalPageOf('tekeli://nope')).toBeNull();
    expect(internalPageOf('https://tekeli.com')).toBeNull();
  });

  it('hides scheme and www in the omnibox', () => {
    expect(displayUrl('https://www.github.com/a')).toBe('github.com/a');
    expect(displayUrl('http://example.com/')).toBe('http://example.com');
    expect(displayUrl('tekeli://newtab')).toBe('');
    expect(displayUrl('tekeli://settings')).toBe('tekeli://settings');
  });

  it('encodes search queries', () => {
    expect(buildSearchUrl('duckduckgo', 'a&b c')).toBe('https://duckduckgo.com/?q=a%26b%20c');
  });
});
