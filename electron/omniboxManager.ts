import { ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import { dbAll, dbRun } from './db.js';

export type OmniboxSuggestionKind = 'history' | 'bookmark';

export interface OmniboxSuggestion {
  kind: OmniboxSuggestionKind;
  url: string;
  title: string;
}

interface SearchHistoryEntry {
  query: string;
  lastUsed: number;
  useCount: number;
}

function getOmniboxSuggestions(search: string, limit: number): OmniboxSuggestion[] {
  const q = search.trim();
  if (!q) return [];

  const prefix = `${q}%`;
  const contains = `%${q}%`;

  const bookmarks = dbAll<OmniboxSuggestion & { score: number; ts: number }>(`
    SELECT
      'bookmark' AS kind,
      url,
      title,
      CASE
        WHEN url LIKE ? THEN 0
        WHEN title LIKE ? THEN 1
        ELSE 2
      END AS score,
      created_at AS ts
    FROM bookmarks
    WHERE url LIKE ? OR title LIKE ?
    ORDER BY score ASC, ts DESC
    LIMIT ?
  `, [prefix, prefix, contains, contains, Math.ceil(limit / 2)]);

  const history = dbAll<OmniboxSuggestion & { score: number; ts: number }>(`
    SELECT
      'history' AS kind,
      url,
      title,
      CASE
        WHEN url LIKE ? THEN 0
        WHEN title LIKE ? THEN 1
        ELSE 2
      END AS score,
      last_visit AS ts
    FROM history
    WHERE url LIKE ? OR title LIKE ?
    ORDER BY score ASC, ts DESC
    LIMIT ?
  `, [prefix, prefix, contains, contains, limit]);

  const merged = [...bookmarks, ...history]
    .sort((a, b) => (a.score - b.score) || (b.ts - a.ts))
    .slice(0, limit)
    .map(({ kind, url, title }) => ({ kind, url, title }));

  return merged;
}

function addSearchQuery(query: string): void {
  const q = query.trim();
  if (!q) return;
  dbRun(
    `
      INSERT INTO search_queries (query, last_used, use_count)
      VALUES (?, ?, 1)
      ON CONFLICT(query) DO UPDATE SET
        last_used = excluded.last_used,
        use_count = search_queries.use_count + 1
    `,
    [q, Date.now()]
  );
}

function getSearchHistory(search: string, limit: number): SearchHistoryEntry[] {
  const q = (search || '').trim();
  const lim = Math.max(1, Math.min(30, limit));

  if (!q) {
    return dbAll<{ query: string; lastUsed: number; useCount: number }>(
      `
        SELECT query, last_used AS lastUsed, use_count AS useCount
        FROM search_queries
        ORDER BY last_used DESC
        LIMIT ?
      `,
      [lim]
    );
  }

  const contains = `%${q}%`;
  return dbAll<{ query: string; lastUsed: number; useCount: number }>(
    `
      SELECT query, last_used AS lastUsed, use_count AS useCount
      FROM search_queries
      WHERE query LIKE ?
      ORDER BY last_used DESC
      LIMIT ?
    `,
    [contains, lim]
  );
}

export function initOmniboxManager(): void {
  ipcMain.handle('get-omnibox-suggestions', async (event, search: string, limit?: number) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const lim = typeof limit === 'number' ? Math.max(1, Math.min(20, limit)) : 8;
    return getOmniboxSuggestions(search, lim);
  });

  ipcMain.handle('add-search-query', async (event, query: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    addSearchQuery(String(query || ''));
    return { success: true };
  });

  ipcMain.handle('get-search-history', async (event, search?: string, limit?: number) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const lim = typeof limit === 'number' ? limit : 8;
    return getSearchHistory(String(search || ''), lim);
  });

  console.log('[OmniboxManager] Initialized');
}

export default { initOmniboxManager };
