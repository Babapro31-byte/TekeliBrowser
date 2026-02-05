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
});
