/**
 * TekeliBrowser History Manager
 * Tracks browsing history with search, clear, and auto-pruning
 */

import { app, ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import path from 'path';
import fs from 'fs';

// Types
interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
}

interface HistoryQuery {
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

// State
const HISTORY_FILE = 'history.json';
const MAX_ENTRIES = 10000;
let historyFilePath = '';
let entries: HistoryEntry[] = [];
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function getHistoryPath(): string {
  if (!historyFilePath) {
    historyFilePath = path.join(app.getPath('userData'), HISTORY_FILE);
  }
  return historyFilePath;
}

/**
 * Load history from disk
 */
function loadHistory(): void {
  try {
    const filePath = getHistoryPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      entries = JSON.parse(raw);
      console.log(`[HistoryManager] Loaded ${entries.length} entries`);
    }
  } catch (error: any) {
    console.error('[HistoryManager] Load failed:', error.message);
    entries = [];
  }
}

/**
 * Save history to disk (debounced)
 */
function scheduleSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(getHistoryPath(), JSON.stringify(entries), 'utf-8');
    } catch (error: any) {
      console.error('[HistoryManager] Save failed:', error.message);
    }
  }, 2000); // Debounce 2 seconds
}

/**
 * Add a history entry
 */
function addEntry(url: string, title: string): void {
  // Skip internal URLs
  if (url.startsWith('tekeli://') || url === 'about:blank' || !url) return;

  // Check if URL already exists - update visit count
  const existingIndex = entries.findIndex(e => e.url === url);
  if (existingIndex >= 0) {
    entries[existingIndex].title = title || entries[existingIndex].title;
    entries[existingIndex].timestamp = Date.now();
    entries[existingIndex].visitCount += 1;
    // Move to front
    const [entry] = entries.splice(existingIndex, 1);
    entries.unshift(entry);
  } else {
    entries.unshift({
      url,
      title: title || url,
      timestamp: Date.now(),
      visitCount: 1
    });
  }

  // Prune if over limit
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(0, MAX_ENTRIES);
  }

  scheduleSave();
}

/**
 * Search/get history entries
 */
function getHistory(query?: HistoryQuery): HistoryEntry[] {
  let result = [...entries];

  if (query?.search) {
    const term = query.search.toLowerCase();
    result = result.filter(e =>
      e.url.toLowerCase().includes(term) ||
      e.title.toLowerCase().includes(term)
    );
  }

  if (query?.startDate) {
    result = result.filter(e => e.timestamp >= query.startDate!);
  }

  if (query?.endDate) {
    result = result.filter(e => e.timestamp <= query.endDate!);
  }

  const limit = query?.limit || 200;
  return result.slice(0, limit);
}

/**
 * Clear history
 */
function clearHistory(startDate?: number, endDate?: number): void {
  if (startDate || endDate) {
    entries = entries.filter(e => {
      if (startDate && e.timestamp >= startDate) {
        if (endDate && e.timestamp <= endDate) return false;
        if (!endDate) return false;
      }
      return true;
    });
  } else {
    entries = [];
  }
  scheduleSave();
}

/**
 * Delete a single history entry by URL
 */
function deleteEntry(url: string): void {
  entries = entries.filter(e => e.url !== url);
  scheduleSave();
}

/**
 * Initialize history manager IPC handlers
 */
export function initHistoryManager(): void {
  // Load existing history
  loadHistory();

  // Add history entry
  ipcMain.handle('add-history', async (event, url: string, title: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    addEntry(url, title);
    return { success: true };
  });

  // Get history
  ipcMain.handle('get-history', async (event, query?: HistoryQuery) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return getHistory(query);
  });

  // Clear history
  ipcMain.handle('clear-history', async (event, startDate?: number, endDate?: number) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    clearHistory(startDate, endDate);
    return { success: true };
  });

  // Delete single entry
  ipcMain.handle('delete-history-entry', async (event, url: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    deleteEntry(url);
    return { success: true };
  });

  // Save on quit
  app.on('before-quit', () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    try {
      fs.writeFileSync(getHistoryPath(), JSON.stringify(entries), 'utf-8');
    } catch {
      // Ignore errors during shutdown
    }
  });

  console.log('[HistoryManager] Initialized');
}

export default { initHistoryManager };
