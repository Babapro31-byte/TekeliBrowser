/**
 * Site permissions. Keyed by full origin (never a loose domain match). Anything not in SAFE or
 * PROMPTABLE is denied silently; PROMPTABLE ones are queued and shown in the window's permission bar.
 */
import { app, webContents, type Session, type WebContents } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { handle } from '../core/ipc';
import { log } from '../core/logger';
import { ctxFromSender, type WindowCtx } from '../app/window';

export type Decision = 'allow' | 'block';

const SAFE = new Set(['fullscreen', 'clipboard-sanitized-write', 'pointerLock', 'keyboardLock', 'automatic-fullscreen']);
export const PROMPTABLE = new Set(['media', 'geolocation', 'notifications', 'midi', 'clipboard-read', 'idle-detection', 'window-management', 'local-fonts']);

let store: Record<string, Record<string, Decision>> = {};
let loaded = false;
let saveTimer: NodeJS.Timeout | null = null;

const file = () => path.join(app.getPath('userData'), 'permissions.json');

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = JSON.parse(fs.readFileSync(file(), 'utf-8')) as Record<string, Record<string, unknown>>;
    for (const [origin, perms] of Object.entries(raw)) {
      for (const [perm, d] of Object.entries(perms)) {
        if (d === 'allow' || d === 'block') (store[origin] ??= {})[perm] = d;
      }
    }
  } catch { /* first run */ }
}

function saveSoon(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(file(), JSON.stringify(store)); } catch (err) { log.warn('[permissions] save failed:', err); }
  }, 400);
}

export function originOf(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.origin : null;
  } catch { return null; }
}

export const decisionFor = (origin: string, permission: string): Decision | null => store[origin]?.[permission] ?? null;

export interface PendingInfo { id: string; origin: string; permission: string; media: string[] }
interface Pending extends PendingInfo { cbs: ((allow: boolean) => void)[]; wcId: number; timer: NodeJS.Timeout; isPrivate: boolean }
const pending = new Map<string, Pending>();

function pendingFor(ctx: WindowCtx | null): PendingInfo[] {
  if (!ctx) return [];
  return [...pending.values()]
    .filter((p) => ctxFromSenderId(p.wcId) === ctx)
    .map(({ id, origin, permission, media }) => ({ id, origin, permission, media }));
}

function ctxFromSenderId(id: number): WindowCtx | null {
  const wc = webContents.fromId(id);
  return wc ? ctxFromSender(wc) : null;
}

function publish(ctx: WindowCtx | null): void {
  if (!ctx || ctx.win.isDestroyed()) return;
  const list = pendingFor(ctx);
  const open = list.length > 0;
  if (ctx.permBar !== open) { ctx.permBar = open; ctx.tabs.layout(); }
  ctx.win.webContents.send('permissions:state', list);
}

function settle(p: Pending, allow: boolean, remember: boolean): void {
  clearTimeout(p.timer);
  pending.delete(p.id);
  for (const cb of p.cbs) { try { cb(allow); } catch { /* request already gone */ } }
  if (remember && !p.isPrivate) {
    (store[p.origin] ??= {})[p.permission] = allow ? 'allow' : 'block';
    saveSoon();
  }
}

export function configurePermissions(ses: Session, isPrivate: boolean): void {
  load();

  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (SAFE.has(permission)) { callback(true); return; }
    const origin = originOf(details.requestingUrl || wc.getURL());
    if (!origin || !PROMPTABLE.has(permission)) { callback(false); return; }
    const known = decisionFor(origin, permission);
    if (known) { callback(known === 'allow'); return; }

    const media = permission === 'media' ? ((details as { mediaTypes?: string[] }).mediaTypes ?? []) : [];
    const dup = [...pending.values()].find((p) => p.origin === origin && p.permission === permission && p.wcId === wc.id);
    if (dup) { dup.cbs.push(callback); return; }

    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const entry: Pending = {
      id, origin, permission, media, cbs: [callback], wcId: wc.id, isPrivate,
      timer: setTimeout(() => { settle(entry, false, false); publish(ctxFromSenderId(wc.id)); }, 120_000),
    };
    pending.set(id, entry);
    publish(ctxFromSender(wc));
  });

  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    if (SAFE.has(permission)) return true;
    const origin = originOf(requestingOrigin) ?? requestingOrigin;
    return decisionFor(origin, permission) === 'allow';
  });
  ses.setDevicePermissionHandler(() => false);
  ses.setDisplayMediaRequestHandler((_request, callback) => callback({}));
}

/** Drop pending prompts for a tab that navigated away. */
export function dismissFor(wc: WebContents): void {
  const ctx = ctxFromSender(wc);
  let any = false;
  for (const p of [...pending.values()]) if (p.wcId === wc.id) { settle(p, false, false); any = true; }
  if (any) publish(ctx);
}

export function clearAllPermissions(): void {
  store = {};
  saveSoon();
}

export function registerPermissionsIpc(): void {
  load();
  handle('permissions:respond', (event, cmd: { id: string; allow: boolean; remember?: boolean }) => {
    const p = typeof cmd?.id === 'string' ? pending.get(cmd.id) : undefined;
    if (!p) return { ok: false };
    const ctx = ctxFromSender(event.sender);
    settle(p, !!cmd.allow, cmd.remember !== false);
    publish(ctx);
    return { ok: true };
  });
  handle('permissions:pending', (event) => ({ items: pendingFor(ctxFromSender(event.sender)) }));
  handle('permissions:list', () => ({
    items: Object.entries(store).flatMap(([origin, perms]) => Object.entries(perms).map(([permission, decision]) => ({ origin, permission, decision }))),
  }));
  handle('permissions:clear', (_e, cmd?: { origin?: string; permission?: string }) => {
    if (cmd?.origin && cmd.permission) { delete store[cmd.origin]?.[cmd.permission]; if (store[cmd.origin] && Object.keys(store[cmd.origin]).length === 0) delete store[cmd.origin]; }
    else if (cmd?.origin) delete store[cmd.origin];
    else store = {};
    saveSoon();
    return { ok: true };
  });
}
