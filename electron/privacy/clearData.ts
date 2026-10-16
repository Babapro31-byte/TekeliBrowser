/**
 * "Clear browsing data": real session wipes, not just history.
 * `since` (epoch ms) only limits history and search suggestions: Electron cannot clear cookies, site data
 * or cache by time range, so those are always wiped completely.
 */
import { session } from 'electron';
import { handle } from '../core/ipc';
import { log } from '../core/logger';
import { clearAllPasswords } from '../passwordManager';
import { clearHistory, clearSearchQueries } from '../data/store';
import { getSettings } from '../app/settingsStore';
import { broadcast } from '../app/window';
import { clearAllPermissions } from './permissions';

export interface ClearOptions {
  history?: boolean;
  cookiesAndSiteData?: boolean;
  cache?: boolean;
  passwords?: boolean;
  sitePermissions?: boolean;
  since?: number;
}

const STORAGES = ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage', 'filesystem', 'shadercache'] as const;

export async function clearBrowsingData(o: ClearOptions): Promise<void> {
  const ses = session.fromPartition('persist:web');
  if (o.history) { clearHistory(o.since); clearSearchQueries(o.since); broadcast('history:changed'); }
  if (o.cookiesAndSiteData) await ses.clearStorageData({ storages: [...STORAGES] });
  if (o.cache) { await ses.clearCache(); await ses.clearCodeCaches({}); }
  if (o.passwords) clearAllPasswords();
  if (o.sitePermissions) clearAllPermissions();
}

let exitCleaned = false;

/** Runs on quit when "clear on exit" is on. Returns true if it started async work (caller re-quits afterwards). */
export function clearOnExitIfNeeded(done: () => void): boolean {
  if (exitCleaned || !getSettings().clearOnExit) return false;
  exitCleaned = true;
  clearBrowsingData({ cookiesAndSiteData: true, cache: true })
    .catch((err) => log.warn('[clear] on-exit failed:', err))
    .finally(done);
  return true;
}

export function registerClearDataIpc(): void {
  handle('data:clear', async (_e, opts: ClearOptions) => {
    const since = typeof opts?.since === 'number' && Number.isFinite(opts.since) && opts.since > 0 && opts.since <= Date.now() ? opts.since : undefined;
    const o: ClearOptions = {
      history: !!opts?.history, cookiesAndSiteData: !!opts?.cookiesAndSiteData, cache: !!opts?.cache,
      passwords: !!opts?.passwords, sitePermissions: !!opts?.sitePermissions, since,
    };
    await clearBrowsingData(o);
    return { ok: true };
  });
}
