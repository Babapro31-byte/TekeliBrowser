/**
 * TekeliBrowser Incognito Manager
 * Creates ephemeral session partitions for private browsing
 */

import { ipcMain, session } from 'electron';
import { isValidSender } from './ipcValidation.js';

const PARTITION_PREFIX = 'incognito-';

/**
 * Create a new incognito partition (non-persistent)
 * Returns the partition name for the webview to use
 */
export function createIncognitoPartition(): string {
  const partition = `${PARTITION_PREFIX}${Date.now()}`;
  // Non-persistent: no "persist:" prefix - session is in-memory only
  return partition;
}

/**
 * Clear incognito session storage when tab is closed
 */
export function clearIncognitoSession(partition: string): void {
  if (!partition.startsWith(PARTITION_PREFIX)) return;
  try {
    const sess = session.fromPartition(partition);
    sess.clearStorageData({ storages: ['cookies', 'cache', 'localstorage', 'indexdb'] });
    sess.clearCache();
    console.log(`[IncognitoManager] Cleared session: ${partition}`);
  } catch (err: any) {
    console.error('[IncognitoManager] Clear failed:', err.message);
  }
}

/**
 * Initialize incognito manager IPC handlers
 */
export function initIncognitoManager(): void {
  ipcMain.handle('clear-incognito-session', async (event, partition: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    clearIncognitoSession(partition);
    return { success: true };
  });

  console.log('[IncognitoManager] Initialized');
}

export default { initIncognitoManager };
