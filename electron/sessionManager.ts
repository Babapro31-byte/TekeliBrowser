/**
 * TekeliBrowser Session Manager
 * Handles session save/restore, crash recovery, and recently closed tabs
 */

import { app, ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import path from 'path';
import fs from 'fs';

// Types
interface SessionTab {
  id: string;
  title: string;
  url: string;
}

interface SessionData {
  tabs: SessionTab[];
  activeTabId: string;
  cleanShutdown: boolean;
  timestamp: number;
}

interface ClosedTab {
  title: string;
  url: string;
  closedAt: number;
}

// State
const SESSION_FILE = 'session.json';
let sessionFilePath = '';
let recentlyClosed: ClosedTab[] = [];
const MAX_RECENTLY_CLOSED = 10;

function getSessionPath(): string {
  if (!sessionFilePath) {
    sessionFilePath = path.join(app.getPath('userData'), SESSION_FILE);
  }
  return sessionFilePath;
}

/**
 * Save current session to disk
 */
function saveSession(tabs: SessionTab[], activeTabId: string, cleanShutdown: boolean): void {
  try {
    const data: SessionData = {
      tabs,
      activeTabId,
      cleanShutdown,
      timestamp: Date.now()
    };
    fs.writeFileSync(getSessionPath(), JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[SessionManager] Saved ${tabs.length} tabs`);
  } catch (error: any) {
    console.error('[SessionManager] Save failed:', error.message);
  }
}

/**
 * Restore session from disk
 */
function restoreSession(): { tabs: SessionTab[]; activeTabId: string; wasCleanShutdown: boolean } | null {
  try {
    const filePath = getSessionPath();
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: SessionData = JSON.parse(raw);

    if (!data.tabs || data.tabs.length === 0) {
      return null;
    }

    return {
      tabs: data.tabs,
      activeTabId: data.activeTabId,
      wasCleanShutdown: data.cleanShutdown
    };
  } catch (error: any) {
    console.error('[SessionManager] Restore failed:', error.message);
    return null;
  }
}

/**
 * Track a closed tab
 */
function addClosedTab(tab: { title: string; url: string }): void {
  // Don't track new tab pages
  if (tab.url === 'tekeli://newtab' || tab.url === 'about:blank') return;

  recentlyClosed.unshift({
    title: tab.title,
    url: tab.url,
    closedAt: Date.now()
  });

  // Keep only the last N entries
  if (recentlyClosed.length > MAX_RECENTLY_CLOSED) {
    recentlyClosed = recentlyClosed.slice(0, MAX_RECENTLY_CLOSED);
  }
}

/**
 * Get recently closed tabs
 */
function getRecentlyClosed(): ClosedTab[] {
  return [...recentlyClosed];
}

/**
 * Initialize session manager IPC handlers
 */
export function initSessionManager(): void {
  // Save session
  ipcMain.handle('save-session', async (event, tabs: SessionTab[], activeTabId: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    saveSession(tabs, activeTabId, true);
    return { success: true };
  });

  // Restore session
  ipcMain.handle('restore-session', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const session = restoreSession();
    return session;
  });

  // Track closed tab
  ipcMain.handle('tab-closed', async (event, tab: { title: string; url: string }) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    addClosedTab(tab);
    return { success: true };
  });

  // Get recently closed tabs
  ipcMain.handle('get-recently-closed', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return getRecentlyClosed();
  });

  // Mark shutdown as clean when app is about to quit
  app.on('before-quit', () => {
    // Mark clean shutdown in the existing session file
    try {
      const filePath = getSessionPath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data: SessionData = JSON.parse(raw);
        data.cleanShutdown = true;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch {
      // Ignore errors during shutdown
    }
  });

  console.log('[SessionManager] Initialized');
}

export default { initSessionManager };
