export interface AdBlockStats {
  total: number;
  session: number;
}

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | null;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  currentVersion: string;
}

export interface SessionTab {
  id: string;
  title: string;
  url: string;
}

export interface SessionData {
  tabs: SessionTab[];
  activeTabId: string;
  wasCleanShutdown: boolean;
} 

export interface ClosedTab {
  title: string;
  url: string;
  closedAt: number;
}

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
}

export interface HistoryQuery {
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

export type SearchEngine = 'duckduckgo' | 'google';

export interface BookmarkEntry {
  id: number;
  url: string;
  title: string;
  createdAt: number;
}

export interface BookmarksQuery {
  search?: string;
  limit?: number;
}

export type OmniboxSuggestionKind = 'history' | 'bookmark';

export interface OmniboxSuggestion {
  kind: OmniboxSuggestionKind;
  url: string;
  title: string;
}

export interface IElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // Tab management
  createTab: (url: string) => Promise<{ success: boolean; url: string }>;
  navigateTab: (tabId: string, url: string) => Promise<{ success: boolean; tabId: string; url: string }>;
  closeTab: (tabId: string) => Promise<{ success: boolean; tabId: string }>;
  
  // Session management
  saveSession: (tabs: SessionTab[], activeTabId: string) => Promise<{ success: boolean }>;
  restoreSession: () => Promise<SessionData | null>;
  tabClosed: (tab: { title: string; url: string }) => Promise<{ success: boolean }>;
  getRecentlyClosed: () => Promise<ClosedTab[]>;
  createIncognitoPartition: () => Promise<{ partition: string }>;
  clearIncognitoSession: (partition: string) => Promise<{ success: boolean }>;
  
  // History
  addHistory: (url: string, title: string) => Promise<{ success: boolean }>;
  getHistory: (query?: HistoryQuery) => Promise<HistoryEntry[]>;
  clearHistory: (startDate?: number, endDate?: number) => Promise<{ success: boolean }>;
  deleteHistoryEntry: (url: string) => Promise<{ success: boolean }>;

  // Bookmarks
  addBookmark: (url: string, title: string) => Promise<{ success: boolean }>;
  removeBookmark: (url: string) => Promise<{ success: boolean }>;
  isBookmarked: (url: string) => Promise<{ bookmarked: boolean }>;
  getBookmarks: (query?: BookmarksQuery) => Promise<BookmarkEntry[]>;

  // Omnibox
  getOmniboxSuggestions: (search: string, limit?: number) => Promise<OmniboxSuggestion[]>;
  
  // Permission prompts
  onPermissionRequest: (callback: (data: { requestId: string; site: string; permission: string; requestingUrl?: string }) => void) => () => void;
  permissionResponse: (data: { requestId: string; allow: boolean; remember: boolean; site: string; permission: string }) => Promise<{ success: boolean }>;
  getAllPermissions: () => Promise<Record<string, Record<string, 'allow' | 'block'>>>;
  clearSitePermission: (site?: string, permission?: string) => Promise<{ success: boolean }>;

  // Popup redirect - open URL in new tab
  onOpenUrlInNewTab: (callback: (url: string) => void) => () => void;

  // Keyboard shortcut events from main process
  onShortcut: (callback: (data: { action: string }) => void) => () => void;
  
  // Ad blocker
  getAdBlockStats: () => Promise<AdBlockStats>;
  setTrackerBlocking: (enabled: boolean) => Promise<{ success: boolean }>;
  getTrackerBlocking: () => Promise<{ enabled: boolean }>;
  setCookiePolicy: (policy: 'all' | 'block-third-party' | 'block-all') => Promise<{ success: boolean }>;
  getCookiePolicy: () => Promise<{ policy: 'all' | 'block-third-party' | 'block-all' }>;
  setSearchEngine: (engine: SearchEngine) => Promise<{ success: boolean }>;
  getSearchEngine: () => Promise<{ engine: SearchEngine }>;
  
  // Auto-updater
  checkForUpdates: () => Promise<{ success: boolean; updateInfo?: UpdateInfo; error?: string }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean; error?: string }>;
  getUpdateState: () => Promise<UpdateState>;
  cancelUpdateDownload: () => Promise<{ success: boolean; error?: string }>;
  
  // Update event listeners (returns cleanup function)
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (data: UpdateInfo) => void) => () => void;
  onUpdateNotAvailable: (callback: (data: { version: string }) => void) => () => void;
  onUpdateDownloadProgress: (callback: (data: UpdateProgress) => void) => () => void;
  onUpdateDownloaded: (callback: (data: UpdateInfo) => void) => () => void;
  onUpdateError: (callback: (data: { message: string }) => void) => () => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
