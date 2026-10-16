import { app, nativeTheme } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_SETTINGS, mergeSettings, resolveTheme, type ResolvedTheme, type Settings } from '../../shared/settings';
import { resolveLang, type Lang } from '../../shared/i18n';
import { log } from '../core/logger';

let current: Settings = { ...DEFAULT_SETTINGS };
let file = '';
let writeTimer: NodeJS.Timeout | null = null;
const listeners = new Set<(s: Settings, changed: (keyof Settings)[]) => void>();

/** Map the pre-v4 settings.json keys onto the new schema (one-way, best effort). */
export function migrateLegacy(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  if (typeof raw.trackerBlocking === 'boolean' && out.adblockEnabled === undefined) out.adblockEnabled = raw.trackerBlocking;
  if (raw.dohProvider === 'off') out.dohMode = 'off';
  delete out.trackerBlocking;
  return out;
}

function flushNow(): void {
  if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
  try {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(current, null, 2), 'utf-8');
    fs.renameSync(tmp, file);
  } catch (err) {
    log.error('[settings] save failed:', err);
  }
}

export function initSettings(): Settings {
  file = path.join(app.getPath('userData'), 'settings.json');
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, unknown>;
      current = mergeSettings(DEFAULT_SETTINGS, migrateLegacy(raw));
    }
  } catch (err) {
    log.error('[settings] load failed, using defaults:', err);
  }
  nativeTheme.themeSource = current.theme === 'system' ? 'system' : current.theme === 'light' ? 'light' : 'dark';
  return current;
}

export const getSettings = (): Settings => current;

export function updateSettings(patch: unknown): Settings {
  const next = mergeSettings(current, patch);
  const changed = (Object.keys(next) as (keyof Settings)[]).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(current[k]));
  if (changed.length === 0) return current;
  current = next;
  nativeTheme.themeSource = current.theme === 'system' ? 'system' : current.theme === 'light' ? 'light' : 'dark';
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flushNow, 250);
  for (const fn of listeners) {
    try { fn(current, changed); } catch (err) { log.error('[settings] listener failed:', err); }
  }
  return current;
}

export function onSettingsChanged(fn: (s: Settings, changed: (keyof Settings)[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function flushSettings(): void {
  if (writeTimer) flushNow();
}

export const currentTheme = (): ResolvedTheme => resolveTheme(current.theme, nativeTheme.shouldUseDarkColors);
export const currentLang = (): Lang => resolveLang(current.language, app.getLocale());

export const THEME_COLORS: Record<ResolvedTheme, { chrome: string; symbol: string; app: string }> = {
  dark: { chrome: '#16161A', symbol: '#B6B6C0', app: '#0F0F12' },
  light: { chrome: '#E6E6EB', symbol: '#52525B', app: '#F4F4F6' },
  oled: { chrome: '#070708', symbol: '#B2B2BA', app: '#000000' },
};
