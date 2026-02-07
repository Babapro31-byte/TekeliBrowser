/**
 * IPC sender validation - ensures requests come from our app, not remote pages
 */

import type { IpcMainInvokeEvent } from 'electron';

export function isValidSender(event: IpcMainInvokeEvent): boolean {
  try {
    const url = event.sender.getURL();
    return (
      url.startsWith('file://') ||
      url.includes('localhost') ||
      url.startsWith('http://127.0.0.1')
    );
  } catch {
    return false;
  }
}
