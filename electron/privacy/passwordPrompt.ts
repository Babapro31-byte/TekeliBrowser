/**
 * Password bar in the window chrome: "Save password?" and "Fill saved login?".
 * Pages only report what they show (a submitted login form, a visible password field); credentials stay in
 * memory here (save) or in the encrypted store (fill) until the user answers the bar. Autofill never happens
 * on its own, only for the exact saved origin in the top frame, and re-checked when the user clicks Fill.
 * Never active in private windows, never on pages without a normal http(s) origin.
 */
import { handle, listen } from '../core/ipc';
import { ctxFromSender, type WindowCtx } from '../app/window';
import { listPasswordsForOrigin, revealPassword, savePassword, isEncryptionAvailable } from '../passwordManager';
import { canFillFor, httpOrigin, withoutHash } from './autofill';
import { originOf } from './permissions';

interface Candidate { origin: string; username: string; password: string; update: boolean; at: number }
interface Offer { wcId: number; origin: string; url: string; accounts: { id: number; username: string }[] }

const candidates = new WeakMap<WindowCtx, Candidate>();
const offers = new WeakMap<WindowCtx, Offer>();
const TTL = 5 * 60_000;

/** What the bar shows. A pending "save" wins over a "fill" offer. */
function payload(ctx: WindowCtx): unknown {
  const c = candidates.get(ctx);
  if (c) return { kind: 'save', origin: c.origin, username: c.username, update: c.update };
  const o = offers.get(ctx);
  return o ? { kind: 'fill', origin: o.origin, accounts: o.accounts } : null;
}

function publish(ctx: WindowCtx): void {
  const open = candidates.has(ctx) || offers.has(ctx);
  if (ctx.saveBar !== open) { ctx.saveBar = open; ctx.tabs.layout(); }
  if (!ctx.win.isDestroyed()) ctx.win.webContents.send('password:prompt', payload(ctx));
}

/** Called on every tab state change: a fill offer dies when the user leaves that page. */
export function refreshFillOffer(ctx: WindowCtx): void {
  const o = offers.get(ctx);
  if (!o) return;
  const wc = ctx.tabs.activeContents;
  if (!wc || wc.id !== o.wcId || withoutHash(wc.getURL()) !== o.url) { offers.delete(ctx); publish(ctx); }
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
    return ctx ? payload(ctx) : null;
  });

  // A visible password field in the active tab's top frame, on an origin we have logins for.
  listen('password:field-seen', (event) => {
    const ctx = ctxFromSender(event.sender);
    const frame = event.senderFrame;
    if (!ctx || ctx.isPrivate || !frame || frame.parent || !isEncryptionAvailable()) return;
    if (ctx.tabs.activeContents?.id !== event.sender.id) return;
    const origin = httpOrigin(frame.url);
    if (!origin) return;
    const accounts = listPasswordsForOrigin(origin).map((p) => ({ id: p.id, username: p.username }));
    if (accounts.length === 0) return;
    offers.set(ctx, { wcId: event.sender.id, origin, url: withoutHash(frame.url), accounts });
    publish(ctx);
  }, { trusted: false });

  handle('password:fill', (event, id: number) => {
    const ctx = ctxFromSender(event.sender);
    const offer = ctx ? offers.get(ctx) : undefined;
    const wc = ctx?.tabs.activeContents;
    if (!ctx || !offer || !wc || wc.id !== offer.wcId || !offer.accounts.some((a) => a.id === id)) return { ok: false };
    // Re-check at the moment of use: the page may have navigated since the offer was made.
    if (!canFillFor(wc.mainFrame.url, offer.origin, true)) return { ok: false };
    const secret = revealPassword(id);
    const account = offer.accounts.find((a) => a.id === id);
    offers.delete(ctx);
    publish(ctx);
    if (secret === null || !account) return { ok: false };
    wc.send('password:fill', { username: account.username, password: secret });
    return { ok: true };
  });

  handle('password:fill-dismiss', (event) => {
    const ctx = ctxFromSender(event.sender);
    if (ctx) { offers.delete(ctx); publish(ctx); }
    return { ok: true };
  });
}
