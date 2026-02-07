import { ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import { dbAll } from './db.js';

export type OmniboxSuggestionKind = 'history' | 'bookmark';

export interface OmniboxSuggestion {
  kind: OmniboxSuggestionKind;
  url: string;
  title: string;
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

export function initOmniboxManager(): void {
  ipcMain.handle('get-omnibox-suggestions', async (event, search: string, limit?: number) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const lim = typeof limit === 'number' ? Math.max(1, Math.min(20, limit)) : 8;
    return getOmniboxSuggestions(search, lim);
  });

  console.log('[OmniboxManager] Initialized');
}

export default { initOmniboxManager };
