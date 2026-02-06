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

export interface IElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // Tab management
  createTab: (url: string) => Promise<{ success: boolean; url: string }>;
  navigateTab: (tabId: string, url: string) => Promise<{ success: boolean; tabId: string; url: string }>;
  closeTab: (tabId: string) => Promise<{ success: boolean; tabId: string }>;
  
  // Ad blocker
  getAdBlockStats: () => Promise<AdBlockStats>;
  
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
