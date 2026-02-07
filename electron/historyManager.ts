/**
 * TekeliBrowser History Manager
 * Tracks browsing history with search, clear, and auto-pruning
 */

import { app, ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import path from 'path';
import fs from 'fs';
import { dbAll, dbGet, dbRun } from './db.js';

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

const HISTORY_FILE = 'history.json';
const MAX_MIGRATE = 10000;

function getHistoryJsonPath(): string {
  return path.join(app.getPath('userData'), HISTORY_FILE);
}

function migrateHistoryJsonIfNeeded(): void {
  const existingCount = dbGet<{ c: number }>('SELECT COUNT(*) AS c FROM history');
  if ((existingCount?.c ?? 0) > 0) return;

  const filePath = getHistoryJsonPath();
  if (!fs.existsSync(filePath)) return;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const insertSql = `
      INSERT INTO history (url, title, last_visit, visit_count)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = COALESCE(NULLIF(excluded.title, ''), history.title),
        last_visit = excluded.last_visit,
        visit_count = history.visit_count + excluded.visit_count
    `;

    dbRun('BEGIN');
    const limited = parsed.slice(0, MAX_MIGRATE);
    for (const r of limited) {
      if (!r?.url || r.url.startsWith('tekeli://') || r.url === 'about:blank') continue;
      const lastVisit = typeof r.timestamp === 'number' ? r.timestamp : Date.now();
      const visitCount = typeof r.visitCount === 'number' ? Math.max(1, r.visitCount) : 1;
      dbRun(insertSql, [r.url, r.title || r.url, lastVisit, visitCount]);
    }
    dbRun('COMMIT');
    console.log(`[HistoryManager] Migrated ${Math.min(parsed.length, MAX_MIGRATE)} entries from history.json`);
  } catch (error: any) {
    try { dbRun('ROLLBACK'); } catch {}
    console.error('[HistoryManager] Migration failed:', error.message);
  }
}

function addEntry(url: string, title: string): void {
  if (url.startsWith('tekeli://') || url === 'about:blank' || !url) return;
  const sql = `
    INSERT INTO history (url, title, last_visit, visit_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(url) DO UPDATE SET
      title = COALESCE(NULLIF(excluded.title, ''), history.title),
      last_visit = excluded.last_visit,
      visit_count = history.visit_count + 1
  `;
  dbRun(sql, [url, title || url, Date.now()]);
}

function getHistory(query?: HistoryQuery): HistoryEntry[] {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (query?.search) {
    where.push('(url LIKE ? OR title LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term);
  }

  if (query?.startDate) {
    where.push('last_visit >= ?');
    params.push(query.startDate);
  }

  if (query?.endDate) {
    where.push('last_visit <= ?');
    params.push(query.endDate);
  }

  const limit = query?.limit ?? 200;
  const sql = `
    SELECT
      url,
      title,
      last_visit AS timestamp,
      visit_count AS visitCount
    FROM history
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY last_visit DESC
    LIMIT ?
  `;
  params.push(limit);
  return dbAll<HistoryEntry>(sql, params);
}

function clearHistory(startDate?: number, endDate?: number): void {
  if (!startDate && !endDate) {
    dbRun('DELETE FROM history');
    return;
  }

  const where: string[] = [];
  const params: number[] = [];
  if (startDate) {
    where.push('last_visit >= ?');
    params.push(startDate);
  }
  if (endDate) {
    where.push('last_visit <= ?');
    params.push(endDate);
  }

  dbRun(`DELETE FROM history WHERE ${where.join(' AND ')}`, params);
}

function deleteEntry(url: string): void {
  dbRun('DELETE FROM history WHERE url = ?', [url]);
}

/**
 * Initialize history manager IPC handlers
 */
export function initHistoryManager(): void {
  migrateHistoryJsonIfNeeded();

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

  console.log('[HistoryManager] Initialized');
}

export default { initHistoryManager };
