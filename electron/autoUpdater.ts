/**
 * TekeliBrowser Auto-Updater Module
 * Handles automatic updates from GitHub Releases
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import { app } from 'electron';

// Update state
interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  updateInfo: UpdateInfo | null;
  progress: ProgressInfo | null;
}

let mainWindow: BrowserWindow | null = null;
let updateState: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  updateInfo: null,
  progress: null
};

/**
 * Send update status to renderer process
 */
function sendStatusToWindow(channel: string, data?: any) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

/**
 * Initialize auto-updater
 */
export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;

  // Configure auto-updater
  autoUpdater.autoDownload = false; // Don't auto-download, let user decide
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoRunAppAfterInstall = true;

  // For development, allow checking for updates
  if (!app.isPackaged) {
    // In dev mode, we can still test the update logic
    // but actual updates won't work
    autoUpdater.forceDevUpdateConfig = true;
  }

  // ==================== EVENT HANDLERS ====================

  // Checking for updates
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
    updateState.checking = true;
    updateState.error = null;
    sendStatusToWindow('update-checking');
  });

  // Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('[AutoUpdater] Update available:', info.version);
    updateState.checking = false;
    updateState.available = true;
    updateState.updateInfo = info;
    sendStatusToWindow('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  });

  // No update available
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('[AutoUpdater] No update available. Current version:', info.version);
    updateState.checking = false;
    updateState.available = false;
    sendStatusToWindow('update-not-available', {
      version: info.version
    });
  });

  // Download progress
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    console.log(`[AutoUpdater] Download progress: ${progress.percent.toFixed(1)}%`);
    updateState.downloading = true;
    updateState.progress = progress;
    sendStatusToWindow('update-download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    updateState.downloading = false;
    updateState.downloaded = true;
    updateState.updateInfo = info;
    sendStatusToWindow('update-downloaded', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  });

  // Error handling
  autoUpdater.on('error', (error: Error) => {
    console.error('[AutoUpdater] Error:', error.message);
    updateState.checking = false;
    updateState.downloading = false;
    updateState.error = error.message;
    sendStatusToWindow('update-error', {
      message: error.message
    });
  });

  // ==================== IPC HANDLERS ====================

  // Check for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      console.log('[AutoUpdater] Manual check triggered');
      const result = await autoUpdater.checkForUpdates();
      return { 
        success: true, 
        updateInfo: result?.updateInfo 
      };
    } catch (error: any) {
      console.error('[AutoUpdater] Check failed:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  // Download update
  ipcMain.handle('download-update', async () => {
    try {
      console.log('[AutoUpdater] Starting download...');
      updateState.downloading = true;
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error: any) {
      console.error('[AutoUpdater] Download failed:', error.message);
      updateState.downloading = false;
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  // Install update and restart
  ipcMain.handle('install-update', async () => {
    try {
      console.log('[AutoUpdater] Installing update and restarting...');
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (error: any) {
      console.error('[AutoUpdater] Install failed:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  // Get update state
  ipcMain.handle('get-update-state', async () => {
    return {
      ...updateState,
      currentVersion: app.getVersion()
    };
  });

  // Cancel download (if possible)
  ipcMain.handle('cancel-update-download', async () => {
    try {
      // Note: electron-updater doesn't have built-in cancel
      // This is a placeholder for future implementation
      updateState.downloading = false;
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  console.log('[AutoUpdater] Initialized');
}

/**
 * Check for updates (called on app start)
 */
export async function checkForUpdatesOnStartup(): Promise<void> {
  // Wait a bit after app starts before checking
  setTimeout(async () => {
    try {
      console.log('[AutoUpdater] Startup check...');
      await autoUpdater.checkForUpdates();
    } catch (error: any) {
      console.log('[AutoUpdater] Startup check failed:', error.message);
      // Silent fail on startup - don't bother user
    }
  }, 5000); // 5 second delay
}

/**
 * Get current app version
 */
export function getCurrentVersion(): string {
  return app.getVersion();
}

export default {
  initAutoUpdater,
  checkForUpdatesOnStartup,
  getCurrentVersion
};
