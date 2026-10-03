import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { log } from './logger';

/** Origins whose frames may call privileged IPC. Filled by the window layer. */
const trustedWebContents = new Set<number>();
const trustedOrigins = new Set<string>(['tekeli://app']);
const registered = new Set<string>();
const INTERNAL_PROTOCOL = 'tekeli:';

export function trustWebContents(id: number): void {
  trustedWebContents.add(id);
}

export function untrustWebContents(id: number): void {
  trustedWebContents.delete(id);
}

export function addTrustedOrigin(origin: string): void {
  trustedOrigins.add(origin);
}

export type SenderLike = {
  sender: { id: number };
  senderFrame?: { url: string; parent?: unknown } | null;
};

/** `URL.origin` is the string "null" for non-special schemes such as tekeli://, so build it by hand. */
export function originOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.origin !== 'null') return u.origin;
    if (u.protocol === 'file:' || !u.host) return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * A sender is trusted when its webContents is app UI we created (chrome / overlay)
 * AND its frame origin is app-owned, OR when the frame origin alone is app-owned
 * (tekeli://app internal pages). Substring checks are never used.
 */
export function isTrustedSender(event: SenderLike, devOrigin = process.env.VITE_DEV_SERVER_URL): boolean {
  const frame = event.senderFrame;
  const url = frame?.url;
  if (!url) return trustedWebContents.has(event.sender.id);

  // Only top-level frames may call privileged IPC; an iframe inside an app page never can.
  if (frame?.parent) return false;

  const origin = originOf(url);
  const isAppOrigin =
    (origin !== null && trustedOrigins.has(origin)) ||
    (devOrigin !== undefined && origin !== null && origin === originOf(devOrigin)) ||
    url.startsWith('file://') ||
    url.startsWith(`${INTERNAL_PROTOCOL}//`);

  if (trustedWebContents.has(event.sender.id)) return isAppOrigin;
  // Internal pages (tekeli://settings …) run in tab webContents we do not register individually.
  return url.startsWith(`${INTERNAL_PROTOCOL}//`) || (origin !== null && trustedOrigins.has(origin));
}

function claim(channel: string): void {
  if (registered.has(channel)) {
    throw new Error(`IPC channel already registered: ${channel}`);
  }
  registered.add(channel);
}

/** `ipcMain.handle` with duplicate detection, sender validation, and stack logging. */
export function handle<A extends unknown[], R>(
  channel: string,
  fn: (event: IpcMainInvokeEvent, ...args: A) => R | Promise<R>,
  opts: { trusted?: boolean } = {},
): void {
  claim(channel);
  ipcMain.handle(channel, async (event, ...args) => {
    if (opts.trusted !== false && !isTrustedSender(event)) {
      log.warn(`[ipc] rejected untrusted sender on "${channel}"`);
      throw new Error('Untrusted sender');
    }
    try {
      return await fn(event, ...(args as A));
    } catch (err) {
      log.error(`[ipc] "${channel}" failed:`, err);
      throw err;
    }
  });
}

/** `ipcMain.on` (fire-and-forget) with the same guarantees. */
export function listen<A extends unknown[]>(
  channel: string,
  fn: (event: IpcMainEvent, ...args: A) => void,
  opts: { trusted?: boolean } = {},
): void {
  claim(channel);
  ipcMain.on(channel, (event, ...args) => {
    if (opts.trusted !== false && !isTrustedSender(event)) {
      log.warn(`[ipc] rejected untrusted sender on "${channel}"`);
      return;
    }
    try {
      fn(event, ...(args as A));
    } catch (err) {
      log.error(`[ipc] "${channel}" failed:`, err);
    }
  });
}

/** Test helper. */
export function __resetIpcForTests(): void {
  registered.clear();
  trustedWebContents.clear();
  trustedOrigins.clear();
  trustedOrigins.add('tekeli://app');
}
