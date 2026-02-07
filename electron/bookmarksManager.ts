import { ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import { dbAll, dbGet, dbRun } from './db.js';

export interface BookmarkEntry {
  id: number;
  url: string;
  title: string;
  createdAt: number;
}

interface BookmarksQuery {
  search?: string;
  limit?: number;
}

function addBookmark(url: string, title: string): void {
  if (!url || url.startsWith('tekeli://') || url === 'about:blank') return;
  const sql = `
    INSERT INTO bookmarks (url, title, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      title = COALESCE(NULLIF(excluded.title, ''), bookmarks.title)
  `;
  dbRun(sql, [url, title || url, Date.now()]);
}

function removeBookmark(url: string): void {
  dbRun('DELETE FROM bookmarks WHERE url = ?', [url]);
}

function isBookmarked(url: string): boolean {
  const row = dbGet<{ one: number }>('SELECT 1 AS one FROM bookmarks WHERE url = ?', [url]);
  return !!row?.one;
}

function getBookmarks(query?: BookmarksQuery): BookmarkEntry[] {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (query?.search) {
    where.push('(url LIKE ? OR title LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term);
  }

  const limit = query?.limit ?? 50;
  const sql = `
    SELECT
      id,
      url,
      title,
      created_at AS createdAt
    FROM bookmarks
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC
    LIMIT ?
  `;
  params.push(limit);
  return dbAll<BookmarkEntry>(sql, params);
}

export function initBookmarksManager(): void {
  ipcMain.handle('add-bookmark', async (event, url: string, title: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    addBookmark(url, title);
    return { success: true };
  });

  ipcMain.handle('remove-bookmark', async (event, url: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    removeBookmark(url);
    return { success: true };
  });

  ipcMain.handle('is-bookmarked', async (event, url: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return { bookmarked: isBookmarked(url) };
  });

  ipcMain.handle('get-bookmarks', async (event, query?: BookmarksQuery) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return getBookmarks(query);
  });

  console.log('[BookmarksManager] Initialized');
}

export default { initBookmarksManager };
