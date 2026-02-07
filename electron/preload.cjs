const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Tab management
  createTab: (url) => ipcRenderer.invoke('tab-create', url),
  navigateTab: (tabId, url) => ipcRenderer.invoke('tab-navigate', tabId, url),
  closeTab: (tabId) => ipcRenderer.invoke('tab-close', tabId),
  
  // Ad blocker
  getAdBlockStats: () => ipcRenderer.invoke('get-adblock-stats'),
  setTrackerBlocking: (enabled) => ipcRenderer.invoke('set-tracker-blocking', enabled),
  getTrackerBlocking: () => ipcRenderer.invoke('get-tracker-blocking'),
  setCookiePolicy: (policy) => ipcRenderer.invoke('set-cookie-policy', policy),
  getCookiePolicy: () => ipcRenderer.invoke('get-cookie-policy'),
  
  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getUpdateState: () => ipcRenderer.invoke('get-update-state'),
  cancelUpdateDownload: () => ipcRenderer.invoke('cancel-update-download'),
  
  // Session management
  saveSession: (tabs, activeTabId) => ipcRenderer.invoke('save-session', tabs, activeTabId),
  createIncognitoPartition: () => ipcRenderer.invoke('create-incognito-partition'),
  clearIncognitoSession: (partition) => ipcRenderer.invoke('clear-incognito-session', partition),
  restoreSession: () => ipcRenderer.invoke('restore-session'),
  tabClosed: (tab) => ipcRenderer.invoke('tab-closed', tab),
  getRecentlyClosed: () => ipcRenderer.invoke('get-recently-closed'),
  
  // History
  addHistory: (url, title) => ipcRenderer.invoke('add-history', url, title),
  getHistory: (query) => ipcRenderer.invoke('get-history', query),
  clearHistory: (startDate, endDate) => ipcRenderer.invoke('clear-history', startDate, endDate),
  deleteHistoryEntry: (url) => ipcRenderer.invoke('delete-history-entry', url),
  
  // Permission request from main process
  onPermissionRequest: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('permission-request', handler);
    return () => ipcRenderer.removeListener('permission-request', handler);
  },
  permissionResponse: (data) => ipcRenderer.invoke('permission-response', data),
  getAllPermissions: () => ipcRenderer.invoke('get-all-permissions'),
  clearSitePermission: (site, permission) => ipcRenderer.invoke('clear-site-permission', site, permission),

  // Open URL in new tab (from popup redirect)
  onOpenUrlInNewTab: (callback) => {
    const handler = (_, url) => callback(url);
    ipcRenderer.on('open-url-in-new-tab', handler);
    return () => ipcRenderer.removeListener('open-url-in-new-tab', handler);
  },

  // Keyboard shortcut events from main process
  onShortcut: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('keyboard-shortcut', handler);
    return () => ipcRenderer.removeListener('keyboard-shortcut', handler);
  },

  // Update event listeners
  onUpdateChecking: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update-checking', handler);
    return () => ipcRenderer.removeListener('update-checking', handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateDownloadProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  onUpdateError: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
});
