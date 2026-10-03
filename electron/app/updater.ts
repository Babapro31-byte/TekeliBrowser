/**
 * Auto update (GitHub Releases via electron-updater). The user decides when to restart:
 * a downloaded update installs on "Restart" or silently on the next quit, never by force.
 */
import { app } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import { handle } from '../core/ipc';
import { log } from '../core/logger';
import { broadcast } from './window';
import { getSettings, onSettingsChanged } from './settingsStore';

export type UpdateStatus = 'disabled' | 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'not-available' | 'error';

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  checkedAt?: number;
  error?: string;
}

let state: UpdateState = { status: 'idle' };
let retried = false;

function setState(next: Partial<UpdateState> & { status: UpdateStatus }): void {
  state = { ...state, error: undefined, ...next };
  broadcast('update:state', state);
}

export const getUpdateState = (): UpdateState => state;

function applySettings(): void {
  const s = getSettings();
  autoUpdater.autoDownload = s.updateAutoDownload;
  autoUpdater.allowPrerelease = s.updateChannel === 'beta';
}

export async function checkForUpdates(): Promise<void> {
  if (state.status === 'disabled' || state.status === 'checking' || state.status === 'downloading') return;
  setState({ status: 'checking' });
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    onError(err);
  }
}

function onError(err: unknown): void {
  const message = String((err as Error)?.message ?? err).split('\n')[0].slice(0, 200);
  log.warn('[updater] error:', message);
  setState({ status: 'error', error: message, checkedAt: Date.now() });
  // A release can be visible before all assets are uploaded; retry once shortly after.
  if (!retried) {
    retried = true;
    setTimeout(() => { retried = false; void checkForUpdates(); }, 2 * 60_000).unref();
  }
}

export function initUpdater(): void {
  handle('update:state', () => state);
  handle('update:check', async () => { await checkForUpdates(); return state; });
  handle('update:download', async () => {
    if (state.status === 'available') {
      setState({ status: 'downloading', percent: 0 });
      try { await autoUpdater.downloadUpdate(); } catch (err) { onError(err); }
    }
    return state;
  });
  handle('update:install', () => {
    if (state.status === 'ready') autoUpdater.quitAndInstall(false, true);
    return { ok: state.status === 'ready' };
  });

  if (!app.isPackaged) {
    state = { status: 'disabled' };
    return;
  }

  autoUpdater.logger = { info: (m) => log.info('[updater]', m), warn: (m) => log.warn('[updater]', m), error: (m) => log.error('[updater]', m), debug: () => undefined };
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoRunAppAfterInstall = true;
  applySettings();
  onSettingsChanged((_s, changed) => { if (changed.includes('updateAutoDownload') || changed.includes('updateChannel')) applySettings(); });

  autoUpdater.on('update-available', (info: UpdateInfo) => setState({ status: getSettings().updateAutoDownload ? 'downloading' : 'available', version: info.version, percent: 0, checkedAt: Date.now() }));
  autoUpdater.on('update-not-available', () => setState({ status: 'not-available', checkedAt: Date.now() }));
  autoUpdater.on('download-progress', (p: ProgressInfo) => setState({ status: 'downloading', percent: Math.round(p.percent), transferred: p.transferred, total: p.total }));
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => { retried = false; setState({ status: 'ready', version: info.version, percent: 100, checkedAt: Date.now() }); });
  autoUpdater.on('error', onError);

  setTimeout(() => void checkForUpdates(), 15_000).unref();
  setInterval(() => void checkForUpdates(), 4 * 3600 * 1000).unref();
}
