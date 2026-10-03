/** Settings schema shared by main and renderer. Main owns persistence; renderers never write storage. */

export type ThemeSetting = 'dark' | 'light' | 'oled' | 'system';
export type AccentId = 'indigo' | 'emerald' | 'amber' | 'rose' | 'neutral';
export type LanguageSetting = 'auto' | 'tr' | 'en';
export type SearchEngineId = 'duckduckgo' | 'google' | 'bing';
export type CookiePolicy = 'all' | 'block-third-party' | 'block-all';
export type FingerprintLevel = 'off' | 'standard' | 'strict';
export type DohMode = 'off' | 'automatic' | 'secure';
export type DohProvider = 'cloudflare' | 'google' | 'quad9';
export type UpdateChannel = 'stable' | 'beta';

export interface Settings {
  language: LanguageSetting;
  theme: ThemeSetting;
  accent: AccentId;
  reduceMotion: boolean;
  searchEngine: SearchEngineId;
  restoreSession: boolean;
  defaultZoom: number; // percent
  showBookmarksBar: boolean;

  adblockEnabled: boolean;
  adblockYoutube: boolean;
  adblockAllowlist: string[]; // hostnames where blocking is off
  httpsOnly: boolean;
  httpsAllowlist: string[];
  dohMode: DohMode;
  dohProvider: DohProvider;
  cookiePolicy: CookiePolicy;
  fingerprint: FingerprintLevel;
  gpc: boolean;
  clearOnExit: boolean;

  updateAutoDownload: boolean;
  updateChannel: UpdateChannel;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  theme: 'dark',
  accent: 'indigo',
  reduceMotion: false,
  searchEngine: 'duckduckgo',
  restoreSession: true,
  defaultZoom: 100,
  showBookmarksBar: false,

  adblockEnabled: true,
  adblockYoutube: true,
  adblockAllowlist: [],
  httpsOnly: true,
  httpsAllowlist: [],
  dohMode: 'automatic',
  dohProvider: 'cloudflare',
  cookiePolicy: 'block-third-party',
  fingerprint: 'standard',
  gpc: true,
  clearOnExit: false,

  updateAutoDownload: true,
  updateChannel: 'stable',
};

const ENUMS: Partial<Record<keyof Settings, readonly string[]>> = {
  language: ['auto', 'tr', 'en'],
  theme: ['dark', 'light', 'oled', 'system'],
  accent: ['indigo', 'emerald', 'amber', 'rose', 'neutral'],
  searchEngine: ['duckduckgo', 'google', 'bing'],
  cookiePolicy: ['all', 'block-third-party', 'block-all'],
  fingerprint: ['off', 'standard', 'strict'],
  dohMode: ['off', 'automatic', 'secure'],
  dohProvider: ['cloudflare', 'google', 'quad9'],
  updateChannel: ['stable', 'beta'],
};

const HOST_RE = /^[a-z0-9.-]{1,253}$/i;

/**
 * Validate an untrusted partial object (disk or IPC) against the schema.
 * Unknown keys and wrongly typed values are dropped, never coerced.
 */
export function sanitizeSettings(input: unknown): Partial<Settings> {
  const out: Record<string, unknown> = {};
  if (typeof input !== 'object' || input === null) return out as Partial<Settings>;
  const src = input as Record<string, unknown>;

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (!(key in src)) continue;
    const value = src[key];
    const def = DEFAULT_SETTINGS[key];

    if (Array.isArray(def)) {
      if (Array.isArray(value)) {
        out[key] = value.filter((v): v is string => typeof v === 'string' && HOST_RE.test(v)).slice(0, 500);
      }
    } else if (typeof def === 'boolean') {
      if (typeof value === 'boolean') out[key] = value;
    } else if (typeof def === 'number') {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = Math.min(300, Math.max(50, Math.round(value)));
    } else if (typeof def === 'string') {
      const allowed = ENUMS[key];
      if (typeof value === 'string' && allowed?.includes(value)) out[key] = value;
    }
  }
  return out as Partial<Settings>;
}

export function mergeSettings(base: Settings, patch: unknown): Settings {
  return { ...base, ...sanitizeSettings(patch) };
}

export type ResolvedTheme = 'dark' | 'light' | 'oled';

export function resolveTheme(theme: ThemeSetting, systemDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}
