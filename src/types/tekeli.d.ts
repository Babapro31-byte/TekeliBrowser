import type { Lang } from '../../shared/i18n';
import type { ResolvedTheme, Settings } from '../../shared/settings';

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  audible: boolean;
  muted: boolean;
  pinned: boolean;
  security: 'secure' | 'insecure' | 'internal' | 'none';
}

export interface TabsState {
  tabs: TabInfo[];
  activeId: number | null;
  canReopen: boolean;
}

export interface Boot {
  settings: Settings;
  theme: ResolvedTheme;
  lang: Lang;
  version: string;
  platform: string;
  isPrivate: boolean;
  tabId: number | null;
}

export interface SettingsPayload {
  settings: Settings;
  theme: ResolvedTheme;
  lang: Lang;
}

export interface HistoryItem { url: string; title: string; timestamp: number; visitCount: number }
export interface BookmarkItem { id: number; url: string; title: string; createdAt: number }
export interface FindResult { activeMatchOrdinal: number; matches: number }

export interface TekeliBridge {
  boot: Boot | null;
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, callback: (payload: never) => void): () => void;
}

declare global {
  interface Window {
    tekeli?: TekeliBridge;
  }
}
