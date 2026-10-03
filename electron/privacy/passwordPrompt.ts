/**
 * "Save password?" flow. Pages only report a submitted login form (via the frame preload);
 * the credential stays in memory here until the user answers the bar in the window chrome.
 * Never active in private windows, never on pages without a normal http(s) origin.
 */
import { handle, listen } from '../core/ipc';
import { ctxFromSender, type WindowCtx } from '../app/window';
import { listPasswordsForOrigin, revealPassword, savePassword, isEncryptionAvailable } from '../passwordManager';
import { originOf } from './permissions';

interface Candidate { origin: string; username: string; password: string; update: boolean; at: number }

const candidates = new WeakMap<WindowCtx, Candidate>();
const TTL = 5 * 60_000;

function publish(ctx: WindowCtx): void {
  const c = candidates.get(ctx);
  const open = !!c;
  if (ctx.saveBar !== open) { ctx.saveBar = open; ctx.tabs.layout(); }
  if (!ctx.win.isDestroyed()) ctx.win.webContents.send('password:prompt', c ? { origin: c.origin, username: c.username, update: c.update } : null);
}

export function registerPasswordPrompt(): void {
  listen('password:capture', (event, data: { username?: unknown; password?: unknown }) => {
    const ctx = ctxFromSender(event.sender);
    if (!ctx || ctx.isPrivate || !isEncryptionAvailable()) return;
    const origin = originOf(event.senderFrame?.url ?? '');
    const username = typeof data?.username === 'string' ? data.username.slice(0, 200) : '';
    const password = typeof data?.password === 'string' ? data.password.slice(0, 500) : '';
    if (!origin || !username || !password) return;

    const existing = listPasswordsForOrigin(origin).find((p) => p.username === username);
    if (existing && revealPassword(existing.id) === password) return; // already saved, unchanged

    candidates.set(ctx, { origin, username, password, update: !!existing, at: Date.now() });
    publish(ctx);
    setTimeout(() => {
      const cur = candidates.get(ctx);
      if (cur && Date.now() - cur.at >= TTL && !ctx.win.isDestroyed()) { candidates.delete(ctx); publish(ctx); }
    }, TTL + 1000).unref();
  }, { trusted: false });

  handle('password:respond', (event, save: boolean) => {
    const ctx = ctxFromSender(event.sender);
    if (!ctx) return { ok: false };
    const c = candidates.get(ctx);
    if (c && save) savePassword(c.origin, c.username, c.password);
    candidates.delete(ctx);
    publish(ctx);
    return { ok: true };
  });

  handle('password:pending', (event) => {
    const ctx = ctxFromSender(event.sender);
    const c = ctx ? candidates.get(ctx) : undefined;
    return c ? { origin: c.origin, username: c.username, update: c.update } : null;
  });
}
