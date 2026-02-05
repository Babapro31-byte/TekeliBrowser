/// <reference types="vite/client" />

interface IElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  createTab: (url: string) => Promise<{ success: boolean; url: string }>;
  navigateTab: (tabId: string, url: string) => Promise<{ success: boolean; tabId: string; url: string }>;
  closeTab: (tabId: string) => Promise<{ success: boolean; tabId: string }>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

// Webview type definition
declare namespace JSX {
  interface IntrinsicElements {
    webview: any;
  }
}
