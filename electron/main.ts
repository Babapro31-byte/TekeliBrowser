import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAdBlocker, setPrivacyUserAgent, getBlockStats, forceUpdateFilters, getFilterManager, setTrackerBlocking, isTrackerBlockingEnabled } from './adBlocker.js';
import { generateYouTubeAdBlockerScript } from './youtubeAdBlocker.js';
import { initAutoUpdater, checkForUpdatesOnStartup, getCurrentVersion } from './autoUpdater.js';
import { initDatabase, flushDatabase } from './db.js';
import { initSessionManager } from './sessionManager.js';
import { initHistoryManager } from './historyManager.js';
import { initBookmarksManager } from './bookmarksManager.js';
import { initOmniboxManager } from './omniboxManager.js';
import { initIncognitoManager, createIncognitoPartition, clearIncognitoSession } from './incognitoManager.js';
import { getSiteFromUrl, getPermission, setPermission, getAllPermissions, clearPermission } from './permissionManager.js';
import { getCookiePolicy, setCookiePolicy, getTrackerBlocking, setTrackerBlockingSetting, getSearchEngine, setSearchEngine } from './settingsManager.js';
import { isValidSender } from './ipcValidation.js';

/** Extract registrable domain from hostname (e.g. "m.youtube.com" -> "youtube.com") */
function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/** Check if request is 3rd-party (different domain than referrer) */
function isThirdPartyRequest(details: Electron.OnBeforeSendHeadersListenerDetails): boolean {
  if (details.resourceType === 'mainFrame') return false;
  const referrer = details.referrer;
  if (!referrer || referrer === '') return false;
  try {
    const reqHost = new URL(details.url).hostname;
    const refHost = new URL(referrer).hostname;
    return getRegistrableDomain(reqHost) !== getRegistrableDomain(refHost);
  } catch {
    return false;
  }
}

/** Apply cookie policy to session via onBeforeSendHeaders */
function applyCookiePolicy(ses: Electron.Session): void {
  ses.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
    const policy = getCookiePolicy();
    if (policy === 'all') {
      callback({ requestHeaders: details.requestHeaders });
      return;
    }
    if (policy === 'block-all') {
      const headers = { ...details.requestHeaders };
      delete headers['Cookie'];
      delete headers['cookie'];
      callback({ requestHeaders: headers });
      return;
    }
    if (policy === 'block-third-party' && isThirdPartyRequest(details)) {
      const headers = { ...details.requestHeaders };
      delete headers['Cookie'];
      delete headers['cookie'];
      callback({ requestHeaders: headers });
      return;
    }
    callback({ requestHeaders: details.requestHeaders });
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Pending permission requests (requestId -> callback)
const pendingPermissionRequests = new Map<string, (allow: boolean) => void>();
let permissionRequestId = 0;

// Suppress security warnings only in development
if (!app.isPackaged) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

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
      sandbox: true,
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

  // Keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    
    // F12 - DevTools
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools();
      return;
    }

    // F11 - Fullscreen toggle
    if (input.key === 'F11') {
      event.preventDefault();
      if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
      return;
    }

    // F5 - Reload
    if (input.key === 'F5') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'reload' });
      return;
    }
    
    const ctrl = input.control || input.meta;
    
    // Ctrl+T - New tab
    if (ctrl && !input.shift && input.key === 't') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'new-tab' });
      return;
    }
    
    // Ctrl+W - Close tab
    if (ctrl && !input.shift && input.key === 'w') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'close-tab' });
      return;
    }
    
    // Ctrl+Shift+T - Reopen last closed tab
    if (ctrl && input.shift && input.key === 'T') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'reopen-tab' });
      return;
    }

    // Ctrl+Shift+N - New incognito tab
    if (ctrl && input.shift && input.key === 'N') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'new-incognito-tab' });
      return;
    }
    
    // Ctrl+H - Toggle history panel
    if (ctrl && !input.shift && input.key === 'h') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'toggle-history' });
      return;
    }
    
    // Ctrl+L - Focus address bar
    if (ctrl && !input.shift && input.key === 'l') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'focus-addressbar' });
      return;
    }

    // Ctrl+R - Reload
    if (ctrl && !input.shift && (input.key === 'r' || input.key === 'R')) {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'reload' });
      return;
    }
    
    // Ctrl+Tab - Next tab
    if (ctrl && !input.shift && input.key === 'Tab') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'next-tab' });
      return;
    }
    
    // Ctrl+Shift+Tab - Previous tab
    if (ctrl && input.shift && input.key === 'Tab') {
      event.preventDefault();
      mainWindow?.webContents.send('keyboard-shortcut', { action: 'prev-tab' });
      return;
    }
  });

  // Validate webview attachment - ensure node integration stays off
  mainWindow.webContents.on('will-attach-webview', (_, webPreferences) => {
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });
}

async function initializeWebviewSession() {
  const webviewSession = session.fromPartition('persist:browser');
  
  // Initialize ad blocker (now async)
  await initAdBlocker(webviewSession);
  setPrivacyUserAgent(webviewSession);
  
  // Set preload script
  webviewSession.setPreloads([path.join(__dirname, 'webviewPreload.cjs')]);
  
  // Cookie policy (3rd-party / all)
  applyCookiePolicy(webviewSession);
  
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
  
  // Site-based permission handler
  webviewSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const alwaysAllow = ['fullscreen', 'pointerLock', 'mediaKeySystem']; // DRM for streaming
    if (alwaysAllow.includes(permission)) {
      callback(true);
      return;
    }

    const site = getSiteFromUrl(details.requestingUrl || details.securityOrigin || '');
    const stored = site ? getPermission(site, permission) : null;

    if (stored !== null) {
      callback(stored === 'allow');
      return;
    }

    // Prompt user via IPC
    const requestId = `perm-${++permissionRequestId}`;
    pendingPermissionRequests.set(requestId, (allow: boolean) => {
      callback(allow);
      pendingPermissionRequests.delete(requestId);
    });
    mainWindow?.webContents.send('permission-request', {
      requestId,
      site: site || 'unknown',
      permission,
      requestingUrl: details.requestingUrl
    });
  });

  // Handle permission check (for already-granted)
  webviewSession.setPermissionCheckHandler((webContents, permission) => {
    if (['fullscreen', 'pointerLock'].includes(permission)) return true;
    return false; // Media/geolocation/notifications require explicit grant via handler
  });
  
  console.log('[TekeliBrowser] Session initialized with YouTube AdBlocker v1.1');
}

/**
 * Set up an incognito session (ad blocker, preload, permissions)
 */
async function setupIncognitoSession(partition: string): Promise<void> {
  const incognitoSession = session.fromPartition(partition);
  await initAdBlocker(incognitoSession);
  setPrivacyUserAgent(incognitoSession);
  incognitoSession.setPreloads([path.join(__dirname, 'webviewPreload.cjs')]);
  applyCookiePolicy(incognitoSession);
  incognitoSession.webRequest.onCompleted({ urls: ['*://*.youtube.com/*'] }, (details) => {
    if (details.resourceType === 'mainFrame' && mainWindow) {
      const filterManager = getFilterManager();
      const filters = filterManager.getFilters();
      const script = generateYouTubeAdBlockerScript(filters);
      mainWindow.webContents.send('inject-adblock-script', { tabUrl: details.url, script });
    }
  });
  incognitoSession.setPermissionRequestHandler((_, permission, callback, details) => {
    if (['fullscreen', 'pointerLock'].includes(permission)) {
      callback(true);
      return;
    }
    const site = getSiteFromUrl(details.requestingUrl || details.securityOrigin || '');
    const stored = site ? getPermission(site, permission) : null;
    if (stored !== null) {
      callback(stored === 'allow');
      return;
    }
    const requestId = `perm-${++permissionRequestId}`;
    pendingPermissionRequests.set(requestId, (allow: boolean) => {
      callback(allow);
      pendingPermissionRequests.delete(requestId);
    });
    mainWindow?.webContents.send('permission-request', {
      requestId, site: site || 'unknown', permission,
      requestingUrl: details.requestingUrl
    });
  });
  incognitoSession.setPermissionCheckHandler((_, permission) => {
    return ['fullscreen', 'pointerLock'].includes(permission);
  });
}

// IPC Handlers - Window Controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// IPC Handlers - Tab Management
ipcMain.handle('tab-create', async (event, url) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return { success: true, url };
});
ipcMain.handle('tab-navigate', async (event, tabId, url) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return { success: true, tabId, url };
});
ipcMain.handle('tab-close', async (event, tabId) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return { success: true, tabId };
});

// IPC Handlers - Ad Blocker
ipcMain.handle('get-adblock-stats', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return getBlockStats();
});

ipcMain.handle('update-adblock-filters', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
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

ipcMain.handle('get-filter-info', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  const filterManager = getFilterManager();
  return filterManager.getStats();
});

// IPC Handler - Incognito tab
ipcMain.handle('create-incognito-partition', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  const partition = createIncognitoPartition();
  await setupIncognitoSession(partition);
  return { partition };
});

// IPC Handler - Tracker blocking toggle
ipcMain.handle('set-tracker-blocking', async (event, enabled: boolean) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  setTrackerBlocking(enabled);
  setTrackerBlockingSetting(enabled);
  return { success: true };
});

ipcMain.handle('get-tracker-blocking', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return { enabled: isTrackerBlockingEnabled() };
});

// IPC Handler - Cookie policy
ipcMain.handle('set-cookie-policy', async (event, policy: 'all' | 'block-third-party' | 'block-all') => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  setCookiePolicy(policy);
  return { success: true };
});

ipcMain.handle('get-cookie-policy', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return { policy: getCookiePolicy() };
});

// IPC Handler - Default search engine (omnibox)
ipcMain.handle('set-search-engine', async (event, engine: 'duckduckgo' | 'google') => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  setSearchEngine(engine);
  return { success: true };
});

ipcMain.handle('get-search-engine', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return { engine: getSearchEngine() };
});

// IPC Handler - Site permissions (for PrivacySettings)
ipcMain.handle('get-all-permissions', async (event) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  return getAllPermissions();
});

ipcMain.handle('clear-site-permission', async (event, site?: string, permission?: string) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  clearPermission(site, permission);
  return { success: true };
});

// IPC Handler - Permission response from renderer
ipcMain.handle('permission-response', async (event, data: { requestId: string; allow: boolean; remember: boolean; site?: string; permission?: string }) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  const { requestId, allow, remember, site, permission } = data;
  const callback = pendingPermissionRequests.get(requestId);
  if (callback) {
    callback(allow);
    pendingPermissionRequests.delete(requestId);
  }
  if (remember && site && permission) {
    setPermission(site, permission, allow ? 'allow' : 'block');
  }
  return { success: true };
});

// IPC Handler - Inject script into specific webview
ipcMain.on('request-adblock-script', (event) => {
  const filterManager = getFilterManager();
  const filters = filterManager.getFilters();
  const script = generateYouTubeAdBlockerScript(filters);
  event.reply('adblock-script', script);
});

// Navigation guards - block dangerous URLs and redirect popups to new tab
function setupNavigationGuards() {
  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'webview') {
      contents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        if (!mainWindow) return;

        if (input.key === 'F11') {
          event.preventDefault();
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
          return;
        }

        if (input.key === 'F5') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'reload' });
          return;
        }

        const ctrl = input.control || input.meta;
        if (!ctrl) return;

        if (!input.shift && input.key === 't') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'new-tab' });
          return;
        }

        if (!input.shift && input.key === 'w') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'close-tab' });
          return;
        }

        if (input.shift && input.key === 'T') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'reopen-tab' });
          return;
        }

        if (input.shift && input.key === 'N') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'new-incognito-tab' });
          return;
        }

        if (!input.shift && input.key === 'h') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'toggle-history' });
          return;
        }

        if (!input.shift && input.key === 'l') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'focus-addressbar' });
          return;
        }

        if (!input.shift && (input.key === 'r' || input.key === 'R')) {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'reload' });
          return;
        }

        if (!input.shift && input.key === 'Tab') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'next-tab' });
          return;
        }

        if (input.shift && input.key === 'Tab') {
          event.preventDefault();
          mainWindow.webContents.send('keyboard-shortcut', { action: 'prev-tab' });
          return;
        }
      });
    }

    contents.on('will-navigate', (event, url) => {
      const parsed = new URL(url);
      const scheme = parsed.protocol.replace(':', '');
      if (['javascript', 'data', 'file'].includes(scheme)) {
        event.preventDefault();
      }
    });

    contents.setWindowOpenHandler((details) => {
      mainWindow?.webContents.send('open-url-in-new-tab', details.url);
      return { action: 'deny' };
    });
  });
}

// CSP for main window (default session - our app shell only)
function setupMainSessionCSP() {
  const defaultSession = session.defaultSession;
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const url = details.url;
    const isAppOrigin =
      url.startsWith('file://') ||
      url.includes('localhost') ||
      url.startsWith('http://127.0.0.1');
    if (!isAppOrigin) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self'";
    const headers = { ...details.responseHeaders };
    headers['Content-Security-Policy'] = [csp];
    callback({ responseHeaders: headers });
  });
}

// App lifecycle
app.whenReady().then(async () => {
  setupNavigationGuards();
  setupMainSessionCSP();

  await initDatabase();

  // Initialize session & history managers (registers IPC handlers)
  initSessionManager();
  initHistoryManager();
  initBookmarksManager();
  initOmniboxManager();
  initIncognitoManager();
  
  // Load privacy settings and apply
  setTrackerBlocking(getTrackerBlocking());

  // Initialize webview session with ad blocker (async)
  await initializeWebviewSession();
  
  // Create main window
  createWindow();
  
  // Initialize auto-updater after window is created
  if (mainWindow) {
    initAutoUpdater(mainWindow);
    // Check for updates on startup (with delay)
    checkForUpdatesOnStartup();
  }
  
  // Handle macOS activate
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  console.log(`[TekeliBrowser] v${getCurrentVersion()} started successfully`);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  flushDatabase();
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('[TekeliBrowser] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[TekeliBrowser] Unhandled rejection:', reason);
});
