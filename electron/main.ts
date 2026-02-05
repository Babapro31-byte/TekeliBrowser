import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAdBlocker, setPrivacyUserAgent, getBlockStats } from './adBlocker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Suppress security warnings in dev
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Performance optimizations
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      backgroundThrottling: false // Prevent throttling
    },
  });

  // Show when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  // Load the app
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // F12 for DevTools
  mainWindow.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'F12') mainWindow?.webContents.toggleDevTools();
  });
}

function initializeWebviewSession() {
  const webviewSession = session.fromPartition('persist:browser');
  
  // Initialize ad blocker
  initAdBlocker(webviewSession);
  setPrivacyUserAgent(webviewSession);
  
  // Set preload
  webviewSession.setPreloads([path.join(__dirname, 'webviewPreload.cjs')]);
  
  // Permissions
  webviewSession.setPermissionRequestHandler((_, permission, callback) => {
    callback(['media', 'mediaKeySystem', 'fullscreen'].includes(permission));
  });
  
  console.log('[TekeliBrowser] Session initialized');
}

// IPC Handlers
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('tab-create', async (_, url) => ({ success: true, url }));
ipcMain.handle('tab-navigate', async (_, tabId, url) => ({ success: true, tabId, url }));
ipcMain.handle('tab-close', async (_, tabId) => ({ success: true, tabId }));
ipcMain.handle('get-adblock-stats', async () => getBlockStats());

// App lifecycle
app.whenReady().then(() => {
  initializeWebviewSession();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
