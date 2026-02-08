/**
 * TekeliBrowser Performance Manager
 * Predictive prefetch, lazy-load enforcement, resource hints
 */

import { ipcMain, session } from 'electron';
import { isValidSender } from './ipcValidation.js';
import { dbRun, dbAll } from './db.js';

interface PrefetchEntry {
  url: string;
  referrer: string;
  accessCount: number;
  lastAccess: number;
  score: number;
}

interface ResourceHint {
  url: string;
  type: 'dns-prefetch' | 'preconnect' | 'preload';
  as?: string;
}

const MAX_HISTORY = 20000;
const PREFETCH_SCORE_THRESHOLD = 0.6;
const PRECONNECT_SCORE_THRESHOLD = 0.8;

class PerfManager {
  private static instance: PerfManager;
  private session: Electron.Session;

  private constructor() {
    this.session = session.fromPartition('persist:webview', { cache: true });
    this.initDB();
    this.setupWebRequestHooks();
  }

  static getInstance(): PerfManager {
    if (!PerfManager.instance) {
      PerfManager.instance = new PerfManager();
    }
    return PerfManager.instance;
  }

  private initDB(): void {
    dbRun(`
      CREATE TABLE IF NOT EXISTS prefetch_stats (
        url TEXT PRIMARY KEY,
        referrer TEXT NOT NULL,
        access_count INTEGER DEFAULT 1,
        last_access INTEGER NOT NULL,
        score REAL DEFAULT 0.0
      );
      CREATE INDEX IF NOT EXISTS idx_prefetch_last ON prefetch_stats(last_access DESC);
      CREATE INDEX IF NOT EXISTS idx_prefetch_score ON prefetch_stats(score DESC);
    `);
  }

  private setupWebRequestHooks(): void {
    // Intercept navigation to update stats
    this.session.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
      if (details.resourceType === 'mainFrame' && details.url.startsWith('http')) {
        this.recordAccess(details.url, details.referrer || '');
      }
      callback({});
    });

    // Inject resource hints on response
    this.session.webRequest.onHeadersReceived({ urls: ['<all_urls>'] }, (details, callback) => {
      if (details.resourceType === 'mainFrame' && details.statusCode === 200) {
        const hints = this.getResourceHintsForUrl(details.url);
        if (hints.length > 0) {
          const headers = { ...details.responseHeaders };
          const linkHeader = hints.map(h => `<${h.url}>; rel=${h.type}${h.as ? `; as=${h.as}` : ''}`).join(', ');
          headers['Link'] = [linkHeader];
          callback({ responseHeaders: headers });
          return;
        }
      }
      callback({ responseHeaders: details.responseHeaders });
    });
  }

  private recordAccess(url: string, referrer: string): void {
    const now = Date.now();
    dbRun(`
      INSERT INTO prefetch_stats (url, referrer, access_count, last_access, score)
      VALUES (?, ?, 1, ?, 0.0)
      ON CONFLICT(url) DO UPDATE SET
        access_count = access_count + 1,
        last_access = excluded.last_access,
        score = MIN(1.0, access_count * 0.1 + (last_access - ?) / 86400000 * 0.01)
    `, [url, referrer, now, now]);

    // Cleanup old entries
    dbRun(`DELETE FROM prefetch_stats WHERE last_access < ?`, [now - 30 * 24 * 60 * 60 * 1000]);
  }

  private getResourceHintsForUrl(url: string): ResourceHint[] {
    const domain = new URL(url).hostname;
    const hints: ResourceHint[] = [];

    // Get high-score same-domain resources
    const rows = dbAll<PrefetchEntry>(`
      SELECT url, score FROM prefetch_stats
      WHERE referrer = ? AND score >= ?
      ORDER BY score DESC
      LIMIT 5
    `, [domain, PREFETCH_SCORE_THRESHOLD]);

    for (const row of rows) {
      if (row.score >= PRECONNECT_SCORE_THRESHOLD) {
        hints.push({ url: `https://${new URL(row.url).hostname}`, type: 'preconnect' });
      } else {
        hints.push({ url: row.url, type: 'dns-prefetch' });
      }
    }

    return hints;
  }

  /** Get predictive prefetch URLs for a page */
  getPredictivePrefetch(url: string): string[] {
    const domain = new URL(url).hostname;
    const rows = dbAll<PrefetchEntry>(`
      SELECT url, score FROM prefetch_stats
      WHERE referrer = ? AND score >= ?
      ORDER BY score DESC
      LIMIT 3
    `, [domain, PREFETCH_SCORE_THRESHOLD]);
    return rows.map(r => r.url);
  }

  /** Clear all prefetch stats */
  clearStats(): void {
    dbRun('DELETE FROM prefetch_stats');
  }
}

export function initPerfManager(): void {
  const manager = PerfManager.getInstance();

  ipcMain.handle('get-predictive-prefetch', async (event, url: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    return manager.getPredictivePrefetch(url);
  });

  ipcMain.handle('clear-prefetch-stats', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    manager.clearStats();
    return { success: true };
  });

  console.log('[PerfManager] Initialized');
}

export default { initPerfManager };