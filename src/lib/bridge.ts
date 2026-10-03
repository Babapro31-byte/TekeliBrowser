/**
 * Renderer-side access to the main process. Settings live in main; this module mirrors them
 * through one store and applies theme/accent/language to <html>. In a plain browser (vite dev
 * without Electron) a small mock keeps the pages renderable for visual checks.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../../shared/settings';
import { t as translate, type Lang, type MessageKey } from '../../shared/i18n';
import type { Boot, SettingsPayload, TabsState } from '../types/tekeli';

const bridge = typeof window !== 'undefined' ? window.tekeli : undefined;
const isMock = !bridge;

const mockBoot: Boot = {
  settings: DEFAULT_SETTINGS,
  theme: new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : new URLSearchParams(location.search).get('theme') === 'oled' ? 'oled' : 'dark',
  lang: navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en',
  version: '4.0.0-dev',
  platform: 'win32',
  isPrivate: new URLSearchParams(location.search).get('private') === '1',
  tabId: 1,
};

export const boot: Boot = bridge?.boot ?? mockBoot;

// ---------- events ----------
const mockListeners = new Map<string, Set<(p: never) => void>>();
export function on<T>(channel: string, cb: (payload: T) => void): () => void {
  if (bridge) return bridge.on(channel, cb as (p: never) => void);
  const set = mockListeners.get(channel) ?? new Set();
  set.add(cb as (p: never) => void);
  mockListeners.set(channel, set);
  return () => set.delete(cb as (p: never) => void);
}
const mockEmit = (channel: string, payload: unknown) => mockListeners.get(channel)?.forEach((cb) => cb(payload as never));

export function useBridgeEvent<T>(channel: string, cb: (payload: T) => void): void {
  useEffect(() => on<T>(channel, cb), [channel, cb]);
}

// ---------- invoke ----------
const MOCK_TABS: TabsState = {
  activeId: 2,
  canReopen: true,
  tabs: [
    { id: 1, url: 'tekeli://newtab', title: 'Yeni sekme', favicon: null, loading: false, canGoBack: false, canGoForward: false, audible: false, muted: false, pinned: false, blocked: 12, security: 'internal' },
    { id: 2, url: 'https://github.com/Babapro31-byte/TekeliBrowser', title: 'GitHub — Tekeli', favicon: null, loading: true, canGoBack: true, canGoForward: false, audible: false, muted: false, pinned: false, blocked: 12, security: 'secure' },
    { id: 3, url: 'https://tr.wikipedia.org/wiki/Gizlilik', title: 'Gizlilik — Vikipedi', favicon: null, loading: false, canGoBack: false, canGoForward: false, audible: true, muted: false, pinned: false, blocked: 12, security: 'secure' },
  ],
};

async function mockInvoke(channel: string, args: unknown[]): Promise<unknown> {
  switch (channel) {
    case 'tabs:state': return MOCK_TABS;
    case 'settings:get': return { settings: state.settings, theme: state.theme, lang: state.lang };
    case 'settings:set': return { settings: { ...state.settings, ...(args[0] as object) }, theme: state.theme, lang: state.lang };
    case 'history:list': return { items: [
      { url: 'https://github.com/Babapro31-byte/TekeliBrowser', title: 'GitHub — Babapro31-byte/TekeliBrowser', timestamp: Date.now() - 3600e3, visitCount: 4 },
      { url: 'https://electronjs.org/docs', title: 'Electron — Docs', timestamp: Date.now() - 7200e3, visitCount: 2 },
      { url: 'https://developer.mozilla.org', title: 'MDN Web Docs', timestamp: Date.now() - 86400e3 - 3600e3, visitCount: 1 },
    ] };
    case 'bookmarks:list': return { items: [] };
    case 'bookmarks:is': return { bookmarked: false };
    case 'omnibox:suggest': return { items: [] };
    default: return { ok: true };
  }
}

export function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  if (bridge) return bridge.invoke<T>(channel, ...args);
  return mockInvoke(channel, args) as Promise<T>;
}

// ---------- settings store ----------
let state: SettingsPayload = { settings: boot.settings, theme: boot.theme, lang: boot.lang };
const subscribers = new Set<() => void>();

function applyToDocument(): void {
  const root = document.documentElement;
  root.dataset.theme = state.theme;
  root.dataset.accent = state.settings.accent;
  root.lang = state.lang;
  if (state.settings.reduceMotion) root.dataset.motion = 'reduced';
  else delete root.dataset.motion;
}

function setState(next: SettingsPayload): void {
  state = next;
  applyToDocument();
  subscribers.forEach((fn) => fn());
}

applyToDocument();
on<SettingsPayload>('settings:changed', setState);

export function useSettingsPayload(): SettingsPayload {
  return useSyncExternalStore((fn) => { subscribers.add(fn); return () => subscribers.delete(fn); }, () => state);
}
export const useSettings = (): Settings => useSettingsPayload().settings;
export const useLang = (): Lang => useSettingsPayload().lang;

export function useT(): (key: MessageKey) => string {
  const lang = useLang();
  return useCallback((key: MessageKey) => translate(lang, key), [lang]);
}

/** Optimistic update; main validates, persists and echoes the real value back. */
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = patch.theme ? (patch.theme === 'system' ? (prefersDark ? 'dark' : 'light') : patch.theme) : state.theme;
  setState({ ...state, theme, settings: { ...state.settings, ...patch } });
  try {
    const res = await invoke<SettingsPayload>('settings:set', patch);
    if (isMock) { mockEmit('settings:changed', res); return; }
    setState(res);
  } catch (err) {
    console.error('settings:set failed', err);
    const fresh = await invoke<SettingsPayload>('settings:get');
    setState(fresh);
  }
}
