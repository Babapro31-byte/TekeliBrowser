import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings, resolveTheme, sanitizeSettings } from './settings';

describe('sanitizeSettings', () => {
  it('keeps valid values', () => {
    expect(sanitizeSettings({ theme: 'light', httpsOnly: false, dohMode: 'secure' })).toEqual({
      theme: 'light',
      httpsOnly: false,
      dohMode: 'secure',
    });
  });

  it('drops unknown keys, wrong types and invalid enum values', () => {
    expect(sanitizeSettings({ theme: 'neon', httpsOnly: 'yes', evil: 1, accent: 5 })).toEqual({});
  });

  it('filters allowlists to hostnames only', () => {
    const out = sanitizeSettings({ adblockAllowlist: ['example.com', 'http://x/', '<script>', 5, 'a.b-c.org'] });
    expect(out.adblockAllowlist).toEqual(['example.com', 'a.b-c.org']);
  });

  it('rejects non-objects', () => {
    expect(sanitizeSettings(null)).toEqual({});
    expect(sanitizeSettings('x')).toEqual({});
    expect(sanitizeSettings([])).toEqual({});
  });
});

describe('mergeSettings', () => {
  it('never lets a patch remove defaults', () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, { theme: 'oled', junk: true });
    expect(merged.theme).toBe('oled');
    expect(merged.adblockEnabled).toBe(true);
    expect('junk' in merged).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('follows the system when asked', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('oled', false)).toBe('oled');
  });
});
