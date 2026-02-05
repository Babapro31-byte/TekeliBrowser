import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAdBlocker, setPrivacyUserAgent, getBlockStats, forceUpdateFilters, getFilterManager } from './adBlocker.js';
import { generateYouTubeAdBlockerScript } from './youtubeAdBlocker.js';

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
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

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

async function initializeWebviewSession() {
  const webviewSession = session.fromPartition('persist:browser');
  
  // Initialize ad blocker (now async)
  await initAdBlocker(webviewSession);
  setPrivacyUserAgent(webviewSession);
  
  // Set preload script
  webviewSession.setPreloads([path.join(__dirname, 'webviewPreload.cjs')]);
  
  // Inject YouTube ad blocker script into YouTube pages
  webviewSession.webRequest.onCompleted({ urls: ['*://*.youtube.com/*'] }, (details) => {
    if (details.resourceType === 'mainFrame' && mainWindow) {
      // Inject advanced ad blocker script
      const filterManager = getFilterManager();
      const filters = filterManager.getFilters();
      const script = generateYouTubeAdBlockerScript(filters);
      
      // Send to renderer to inject into webview
      mainWindow.webContents.send('inject-adblock-script', {
        tabUrl: details.url,
        script: script
      });
    }
  });
  
  // Block WebRTC IP leak (privacy)
  webviewSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'fullscreen', 'pointerLock'];
    
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      console.log('[TekeliBrowser] Blocked permission:', permission);
      callback(false);
    }
  });
  
  // Handle permission check
  webviewSession.setPermissionCheckHandler((webContents, permission) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'fullscreen', 'pointerLock'];
    return allowedPermissions.includes(permission);
  });
  
  console.log('[TekeliBrowser] Session initialized with YouTube AdBlocker v1.1');
}

// IPC Handlers - Window Controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// IPC Handlers - Tab Management
ipcMain.handle('tab-create', async (_, url) => ({ success: true, url }));
ipcMain.handle('tab-navigate', async (_, tabId, url) => ({ success: true, tabId, url }));
ipcMain.handle('tab-close', async (_, tabId) => ({ success: true, tabId }));

// IPC Handlers - Ad Blocker
ipcMain.handle('get-adblock-stats', async () => {
  const stats = getBlockStats();
  return stats;
});

ipcMain.handle('update-adblock-filters', async () => {
  try {
    const result = await forceUpdateFilters();
    return { 
      success: result.success, 
      version: result.version,
      message: result.success ? 'Filters updated successfully' : 'Filters are already up to date'
    };
  } catch (error: any) {
    return { 
      success: false, 
      version: getFilterManager().getVersion(),
      message: error.message || 'Update failed'
    };
  }
});

ipcMain.handle('get-filter-info', async () => {
  const filterManager = getFilterManager();
  return filterManager.getStats();
});

// IPC Handler - Inject script into specific webview
ipcMain.on('request-adblock-script', (event) => {
  const filterManager = getFilterManager();
  const filters = filterManager.getFilters();
  const script = generateYouTubeAdBlockerScript(filters);
  event.reply('adblock-script', script);
});

// App lifecycle
app.whenReady().then(async () => {
  // Initialize webview session with ad blocker (async)
  await initializeWebviewSession();
  
  // Create main window
  createWindow();
  
  // Handle macOS activate
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  console.log('[TekeliBrowser] v1.1 started successfully');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('[TekeliBrowser] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[TekeliBrowser] Unhandled rejection:', reason);
});
