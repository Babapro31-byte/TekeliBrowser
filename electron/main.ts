import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
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
import { getCookiePolicy, setCookiePolicy, getTrackerBlocking, setTrackerBlockingSetting, getSearchEngine, setSearchEngine, getDoHProvider, setDoHProvider, getHttpsOnly, setHttpsOnly, getFingerprintDefender, setFingerprintDefender } from './settingsManager.js';
import { isValidSender } from './ipcValidation.js';
import { initializeAdvancedFeatures } from './advancedFeatures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function appendLog(...args: any[]): void {
  try {
    const line = `[${new Date().toISOString()}] ${args.map(a => {
      try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
    }).join(' ')}
`;
    fs.appendFileSync(path.join(app.getPath('userData'), 'tekeli.log'), line, 'utf-8');
  } catch {}
}

const _log = console.log.bind(console);
const _error = console.error.bind(console);
console.log = (...args: any[]) => { _log(...args); appendLog(...args); };
console.error = (...args: any[]) => { _error(...args); appendLog(...args); };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

/** Apply Electron performance flags */
function applyPerformanceFlags(): void {
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('enable-features', 'NoStatePrefetch');
  console.log('[TekeliBrowser] Performance flags applied');
}

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

/** Apply HTTPS-Only Mode to session */
function applyHttpsOnlyMode(ses: Electron.Session): void {
  // Electron 28 does not expose setHttpsOnlyMode; we enforce via webRequest
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*'] }, (details, callback) => {
    if (details.resourceType === 'mainFrame') {
      const httpsUrl = details.url.replace(/^http:/, 'https:');
      callback({ redirectURL: httpsUrl });
      return;
    }
    callback({});
  });
  console.log('[TekeliBrowser] HTTPS-Only mode enforced via redirect');
}

/** Apply DoH provider */
function applyDoH(ses: Electron.Session, provider: string): void {
  const dohServers: Record<string, string> = {
    cloudflare: 'https://cloudflare-dns.com/dns-query',
    quad9: 'https://dns.quad9.net/dns-query',
    google: 'https://dns.google/dns-query'
  };
  const server = dohServers[provider] || '';
  if (server) {
    // Electron 28 does not expose DoH API; log for now
    console.log('[TekeliBrowser] DoH provider set (logged):', provider);
  }
}

/** Apply fingerprint defender via preload script */
function applyFingerprintDefender(ses: Electron.Session): void {
  const fpScript = `
    (function() {
      const rand = Math.random().toString(36).slice(2);
      const inject = (prop, value) => {
        try {
          Object.defineProperty(window.navigator, prop, {
            get: () => value,
            configurable: false
          });
        } catch {}
      };
      inject('deviceMemory', 8);
      inject('hardwareConcurrency', 4);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = (imageData.data[i] + Math.floor(Math.random() * 2)) % 256;
      }
      ctx.putImageData(imageData, 0, 0);
      console.log('[FP] Canvas fingerprint randomized');
    })();
  `;
  // Electron 28 does not expose addPreloadScript; inject via webview preload instead
  console.log('[TekeliBrowser] Fingerprint defender script ready (will inject via webviewPreload)');
}

/** Apply privacy user-agent */
function applyPrivacyUserAgent(ses: Electron.Session): void {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  ses.setUserAgent(ua);
  console.log('[TekeliBrowser] Privacy user-agent set');
}

/** Initialize webview session with privacy settings */
async function initializeWebviewSession(): Promise<void> {
  const ses = session.fromPartition('persist:webview', { cache: true });
  
  // Apply settings
  applyHttpsOnlyMode(ses);
  applyDoH(ses, 'cloudflare');
  applyFingerprintDefender(ses);
  applyPrivacyUserAgent(ses);
  
  // Apply cookie policy
  applyCookiePolicy(ses);
  
  // Initialize ad blocker
  await initAdBlocker(ses);
  
  // Apply tracker blocking
  if (isTrackerBlockingEnabled()) {
    setTrackerBlocking(true);
  }
  
  console.log('[TekeliBrowser] Webview session initialized');
}

/** Create main window */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0A0A0A'
  });

  // Show when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  // Fallback show after 8s
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      try {
        mainWindow.show();
      } catch {}
    }
  }, 8000);

  // Log failures
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[TekeliBrowser] did-fail-load', { code, desc, url });
  });

  // Load app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

/** Setup navigation guards */
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
        console.log(`[NavigationGuard] Blocked ${scheme} navigation to ${url}`);
      }
    });

    contents.on('will-attach-webview', (event, webPreferences, params) => {
      // Enforce security on webviews
      delete webPreferences.preload;
      delete webPreferences.nodeIntegration;
      delete webPreferences.contextIsolation;
      webPreferences.contextIsolation = true;
      webPreferences.nodeIntegration = false;
      webPreferences.webSecurity = true;
      webPreferences.allowRunningInsecureContent = false;
      webPreferences.experimentalFeatures = false;
      webPreferences.enableBlinkFeatures = '';
      webPreferences.preload = path.join(__dirname, 'webviewPreload.cjs');

      // Block external webviews
      if (params.src && !params.src.startsWith('file://')) {
        try {
          const srcUrl = new URL(params.src);
          if (!srcUrl.protocol.startsWith('http')) {
            event.preventDefault();
            console.log(`[NavigationGuard] Blocked external webview src: ${params.src}`);
          }
        } catch {
          event.preventDefault();
          console.log(`[NavigationGuard] Blocked invalid webview src: ${params.src}`);
        }
      }
    });

    // Handle permission requests via main window
    contents.on('permission-request', async (event, permission, callback, details) => {
      const url = details.requestingUrl || contents.getURL();
      const site = getSiteFromUrl(url);
      const result = await getPermission(permission, site);
      
      if (result === 'allow') {
        callback(true);
      } else if (result === 'block') {
        callback(false);
      } else {
        // Ask user
        if (mainWindow) {
          mainWindow.webContents.send('permission-request', {
            permission,
            site,
            url
          });
        }
        // For now, default to deny
        callback(false);
      }
    });

    // Handle new-window via main window
    contents.setWindowOpenHandler(({ url }) => {
      if (mainWindow) {
        mainWindow.webContents.send('new-tab', url);
      }
      return { action: 'deny' };
    });
  });
}

/** Setup main session CSP */
function setupMainSessionCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // Add security headers to main frame
    if (details.resourceType === 'mainFrame') {
      responseHeaders['X-Content-Type-Options'] = ['nosniff'];
      responseHeaders['X-Frame-Options'] = ['DENY'];
      responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];
    }
    
    callback({ responseHeaders });
  });
}

/** Initialize IPC handlers */
function setupIpcHandlers(): void {
  // Window controls
  ipcMain.handle('window-minimize', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    mainWindow?.minimize();
    return { success: true };
  });

  ipcMain.handle('window-maximize', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
    return { success: true };
  });

  ipcMain.handle('window-close', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    mainWindow?.close();
    return { success: true };
  });

  // Keyboard shortcuts
  ipcMain.handle('on-shortcut', async (event, data) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    mainWindow?.webContents.send('keyboard-shortcut', data);
    return { success: true };
  });

  // Permission request from renderer
  ipcMain.handle('request-permission', async (event, permission: string, site: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const result = await getPermission(permission, site);
    return { granted: result };
  });

  // Settings IPC
  ipcMain.handle('get-cookie-policy', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return { policy: getCookiePolicy() };
  });

  ipcMain.handle('set-cookie-policy', async (event, policy: 'all' | 'block-third-party' | 'block-all') => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    setCookiePolicy(policy);
    return { success: true };
  });

  // Tracker blocking
  ipcMain.handle('get-tracker-blocking', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return { enabled: getTrackerBlocking() };
  });

  ipcMain.handle('set-tracker-blocking', async (event, enabled: boolean) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    setTrackerBlockingSetting(enabled);
    return { success: true };
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

  ipcMain.handle('clear-site-permission', async (event, site: string, permission?: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    clearPermission(site, permission);
    return { success: true };
  });

  // Auto-updater
  ipcMain.handle('check-for-updates', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return await checkForUpdatesOnStartup();
  });

  // Ad blocker stats
  ipcMain.handle('get-adblock-stats', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return getBlockStats();
  });

  // Force filter update
  ipcMain.handle('force-update-filters', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return await forceUpdateFilters();
  });

  // Get filter manager for advanced usage
  ipcMain.handle('get-filter-manager', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return getFilterManager();
  });

  // Get current version
  ipcMain.handle('get-version', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return { version: getCurrentVersion() };
  });
}

// Keyboard shortcuts
app.on('web-contents-created', (_, contents) => {
  if (contents.getType() === 'window') {
    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      
      // F12 - DevTools
      if (input.key === 'F12') {
        contents.toggleDevTools();
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

      // Ctrl+Shift+T - Reopen closed tab
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
  }
});

app.whenReady().then(async () => {
  applyPerformanceFlags();
  setupNavigationGuards();
  setupMainSessionCSP();

  // Initialize session & history managers (registers IPC handlers)
  initSessionManager();
  initHistoryManager();
  initBookmarksManager();
  initOmniboxManager();
  initIncognitoManager();
  initializeAdvancedFeatures();

  // Load privacy settings and apply
  setTrackerBlocking(getTrackerBlocking());

  // Create main window first to avoid "background running / no UI" if init hangs
  createWindow();

  // Initialize webview session (async, non-blocking)
  initializeWebviewSession().catch((err) => {
    console.error('[TekeliBrowser] Webview session init failed:', err);
  });

  // Initialize auto-updater after window is created
  if (mainWindow) {
    initAutoUpdater(mainWindow);
    // Check for updates on startup (with delay)
    setTimeout(() => {
      checkForUpdatesOnStartup();
    }, 5000);
  }

  // Initialize IPC handlers
  setupIpcHandlers();

  console.log('[TekeliBrowser] Application ready');
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

export default { getCurrentVersion };