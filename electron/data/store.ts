/** History, bookmarks and omnibox data. Plain functions over db.ts; IPC wiring lives in app/ipc.ts. */
import { dbAll, dbGet, dbRun } from '../db';

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
}

export interface BookmarkEntry {
  id: number;
  url: string;
  title: string;
  createdAt: number;
}

export type SuggestionKind = 'history' | 'bookmark';

export interface Suggestion {
  kind: SuggestionKind;
  url: string;
  title: string;
}

const isTrackable = (url: string) => /^https?:\/\//i.test(url);

/** Escape LIKE wildcards so user text is matched literally. */
export const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

// ---------- history ----------
export function addHistory(url: string, title: string): void {
  if (!isTrackable(url)) return;
  dbRun(
    `INSERT INTO history (url, title, last_visit, visit_count) VALUES (?, ?, ?, 1)
     ON CONFLICT(url) DO UPDATE SET
       title = COALESCE(NULLIF(excluded.title, ''), history.title),
       last_visit = excluded.last_visit,
       visit_count = history.visit_count + 1`,
    [url, title || url, Date.now()],
  );
}

export function updateHistoryTitle(url: string, title: string): void {
  if (!isTrackable(url) || !title) return;
  dbRun('UPDATE history SET title = ? WHERE url = ?', [title, url]);
}

export function getHistory(opts: { search?: string; limit?: number } = {}): HistoryEntry[] {
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);
  const q = (opts.search ?? '').trim();
  if (!q) {
    return dbAll<HistoryEntry>(
      `SELECT url, title, last_visit AS timestamp, visit_count AS visitCount FROM history ORDER BY last_visit DESC LIMIT ?`,
      [limit],
    );
  }
  const like = `%${likeEscape(q)}%`;
  return dbAll<HistoryEntry>(
    `SELECT url, title, last_visit AS timestamp, visit_count AS visitCount FROM history
     WHERE url LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' ORDER BY last_visit DESC LIMIT ?`,
    [like, like, limit],
  );
}

export function deleteHistoryEntry(url: string): void {
  dbRun('DELETE FROM history WHERE url = ?', [url]);
}

/** Delete history newer than `sinceMs` (epoch ms); no argument clears everything. */
export function clearHistory(sinceMs?: number): void {
  if (typeof sinceMs === 'number' && Number.isFinite(sinceMs)) dbRun('DELETE FROM history WHERE last_visit >= ?', [sinceMs]);
  else dbRun('DELETE FROM history');
}

// ---------- bookmarks ----------
export function addBookmark(url: string, title: string): void {
  if (!isTrackable(url)) return;
  dbRun(
    `INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, ?)
     ON CONFLICT(url) DO UPDATE SET title = COALESCE(NULLIF(excluded.title, ''), bookmarks.title)`,
    [url, title || url, Date.now()],
  );
}

export function removeBookmark(url: string): void {
  dbRun('DELETE FROM bookmarks WHERE url = ?', [url]);
}

export function isBookmarked(url: string): boolean {
  return !!dbGet<{ one: number }>('SELECT 1 AS one FROM bookmarks WHERE url = ?', [url])?.one;
}

export function getBookmarks(opts: { search?: string; limit?: number } = {}): BookmarkEntry[] {
  const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2000);
  const q = (opts.search ?? '').trim();
  if (!q) {
    return dbAll<BookmarkEntry>(`SELECT id, url, title, created_at AS createdAt FROM bookmarks ORDER BY created_at DESC LIMIT ?`, [limit]);
  }
  const like = `%${likeEscape(q)}%`;
  return dbAll<BookmarkEntry>(
    `SELECT id, url, title, created_at AS createdAt FROM bookmarks
     WHERE url LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' ORDER BY created_at DESC LIMIT ?`,
    [like, like, limit],
  );
}

// ---------- omnibox ----------
export function recordSearchQuery(query: string): void {
  const q = query.trim();
  if (!q || q.length > 200) return;
  dbRun(
    `INSERT INTO search_queries (query, last_used, use_count) VALUES (?, ?, 1)
     ON CONFLICT(query) DO UPDATE SET last_used = excluded.last_used, use_count = search_queries.use_count + 1`,
    [q, Date.now()],
  );
}

export function clearSearchQueries(): void {
  dbRun('DELETE FROM search_queries');
}

export function getSuggestions(input: string, limit = 8): Suggestion[] {
  const q = input.trim();
  if (!q) return [];
  const prefix = `${likeEscape(q)}%`;
  const contains = `%${likeEscape(q)}%`;
  type Row = Suggestion & { score: number; ts: number };
  const bookmarks = dbAll<Row>(
    `SELECT 'bookmark' AS kind, url, title,
       CASE WHEN url LIKE ? ESCAPE '\\' THEN 0 WHEN title LIKE ? ESCAPE '\\' THEN 1 ELSE 2 END AS score, created_at AS ts
     FROM bookmarks WHERE url LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' ORDER BY score, ts DESC LIMIT ?`,
    [prefix, prefix, contains, contains, limit],
  );
  const history = dbAll<Row>(
    `SELECT 'history' AS kind, url, title,
       CASE WHEN url LIKE ? ESCAPE '\\' THEN 0 WHEN title LIKE ? ESCAPE '\\' THEN 1 ELSE 2 END AS score, last_visit AS ts
     FROM history WHERE url LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' ORDER BY score, ts DESC LIMIT ?`,
    [prefix, prefix, contains, contains, limit],
  );
  const seen = new Set<string>();
  return [...bookmarks, ...history]
    .sort((a, b) => a.score - b.score || b.ts - a.ts)
    .filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)))
    .slice(0, limit)
    .map(({ kind, url, title }) => ({ kind, url, title }));
}
