export interface AdBlockStats {
  total: number;
  session: number;
}

export interface IElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  createTab: (url: string) => Promise<{ success: boolean; url: string }>;
  navigateTab: (tabId: string, url: string) => Promise<{ success: boolean; tabId: string; url: string }>;
  closeTab: (tabId: string) => Promise<{ success: boolean; tabId: string }>;
  getAdBlockStats: () => Promise<AdBlockStats>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
