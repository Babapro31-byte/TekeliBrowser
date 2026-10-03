/** IPC surface for the chrome UI and tekeli:// internal pages. All handlers go through core/ipc (sender checked). */
import { Menu, app, clipboard, nativeTheme, shell } from 'electron';
import { randomInt } from 'node:crypto';
import { getHostname } from 'tldts';
import { blockedOnPage, blockedTotal } from '../privacy/adblock';
import { allowCertException } from '../privacy/certs';
import { handle, listen } from '../core/ipc';
import {
  addBookmark, clearHistory, deleteHistoryEntry, getBookmarks, getHistory, getSuggestions, isBookmarked,
  recordSearchQuery, removeBookmark,
} from '../data/store';
import { currentLang, currentTheme, getSettings, updateSettings } from './settingsStore';
import { t } from '../../shared/i18n';
import { isSearchInput } from '../../shared/url';
import { broadcast, createWindow, ctxFromSender, focusedCtx, openInternal, runAction, toggleBookmark } from './window';
import type { ShortcutAction } from './shortcuts';

type TabCommand =
  | { type: 'create'; url?: string }
  | { type: 'close' | 'activate' | 'pin' | 'mute'; id: number }
  | { type: 'move'; id: number; index: number }
  | { type: 'navigate'; input: string }
  | { type: 'back' | 'forward' | 'reload' | 'stop' | 'home' | 'reopen' }
  | { type: 'new-window'; private?: boolean }
  | { type: 'show-menu' }
  | { type: 'show-shield' }
  | { type: 'allow-http' | 'allow-cert'; url: string }
  | { type: 'action'; action: ShortcutAction }
  | { type: 'open-internal'; page: 'settings' | 'history' | 'bookmarks' | 'downloads'; sub?: string };

const MENU_ACTIONS = new Set<ShortcutAction>([
  'new-tab', 'new-window', 'new-private-window', 'find', 'print', 'zoom-in', 'zoom-out', 'zoom-reset',
  'history', 'downloads', 'settings', 'devtools', 'fullscreen', 'bookmark',
]);

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isStr = (v: unknown, max = 4096): v is string => typeof v === 'string' && v.length <= max;

const privacySeed = randomInt(1, 2 ** 31 - 1);

export function registerAppIpc(): void {
  // Frame preload of web pages reads this synchronously; it only exposes non-sensitive flags.
  listen('privacy:config', (event) => {
    const s = getSettings();
    event.returnValue = { gpc: s.gpc, fingerprint: s.fingerprint, seed: privacySeed };
  }, { trusted: false });

  handle('privacy:stats', () => ({ total: blockedTotal() }));

  listen('app:bootstrap', (event) => {
    const ctx = ctxFromSender(event.sender);
    event.returnValue = {
      settings: getSettings(),
      theme: currentTheme(),
      lang: currentLang(),
      version: app.getVersion(),
      platform: process.platform,
      isPrivate: ctx?.isPrivate ?? false,
      tabId: ctx?.tabs.tabIdFor(event.sender.id) ?? null,
    };
  });

  handle('settings:get', () => ({ settings: getSettings(), theme: currentTheme(), lang: currentLang() }));
  handle('settings:set', (_e, patch: unknown) => {
    const s = updateSettings(patch);
    return { settings: s, theme: currentTheme(), lang: currentLang() };
  });

  handle('tabs:state', (event) => ctxFromSender(event.sender)?.tabs.getState() ?? { tabs: [], activeId: null, canReopen: false });

  handle('tabs:do', (event, cmd: TabCommand) => {
    const ctx = ctxFromSender(event.sender);
    if (!ctx || typeof cmd !== 'object' || cmd === null) return { ok: false };
    const { tabs } = ctx;
    switch (cmd.type) {
      case 'create': tabs.create(isStr(cmd.url) && cmd.url ? cmd.url : 'tekeli://newtab', { activate: true, afterId: tabs.getState().activeId, focusOmnibox: !cmd.url }); break;
      case 'close': if (isInt(cmd.id)) { if (tabs.getState().tabs.length <= 1) ctx.win.close(); else tabs.close(cmd.id); } break;
      case 'activate': if (isInt(cmd.id)) tabs.activate(cmd.id); break;
      case 'pin': if (isInt(cmd.id)) tabs.pin(cmd.id); break;
      case 'mute': if (isInt(cmd.id)) tabs.toggleMute(cmd.id); break;
      case 'move': if (isInt(cmd.id) && isInt(cmd.index)) tabs.move(cmd.id, cmd.index); break;
      case 'navigate': if (isStr(cmd.input)) { navigateAndRecord(ctx, cmd.input); } break;
      case 'back': tabs.back(); break;
      case 'forward': tabs.forward(); break;
      case 'reload': tabs.reload(false); break;
      case 'stop': tabs.stop(); break;
      case 'home': tabs.home(); break;
      case 'reopen': tabs.reopenClosed(); break;
      case 'show-menu': showAppMenu(ctx); break;
      case 'show-shield': showShieldMenu(ctx); break;
      case 'allow-http': if (isStr(cmd.url)) allowHttp(ctx, cmd.url); break;
      case 'allow-cert': if (isStr(cmd.url)) allowCert(ctx, cmd.url); break;
      case 'new-window': createWindow({ isPrivate: !!cmd.private }).tabs.create('tekeli://newtab', { focusOmnibox: true }); break;
      case 'action': if (MENU_ACTIONS.has(cmd.action)) runAction(ctx, cmd.action, null); break;
      case 'open-internal':
        if (['settings', 'history', 'bookmarks', 'downloads'].includes(cmd.page)) openInternal(ctx, cmd.page, isStr(cmd.sub, 64) && /^[a-z-]*$/.test(cmd.sub ?? '') ? cmd.sub : '');
        break;
      default: return { ok: false };
    }
    return { ok: true };
  });

  handle('find:do', (event, cmd: { text?: string; forward?: boolean; next?: boolean; stop?: boolean; open?: boolean }) => {
    const ctx = ctxFromSender(event.sender);
    if (!ctx) return;
    if (typeof cmd?.open === 'boolean' && ctx.find.open !== cmd.open) { ctx.find.open = cmd.open; ctx.tabs.layout(); }
    if (cmd?.stop) ctx.tabs.stopFind();
    else if (isStr(cmd?.text, 500)) ctx.tabs.find(cmd.text as string, cmd.forward !== false, !!cmd.next);
  });

  // ----- bookmarks / history / omnibox -----
  handle('bookmarks:is', (_e, url: string) => ({ bookmarked: isStr(url) && isBookmarked(url) }));
  handle('bookmarks:toggle', (event) => { const ctx = ctxFromSender(event.sender); if (ctx) toggleBookmark(ctx); return { ok: true }; });
  handle('bookmarks:list', (_e, search?: string) => ({ items: getBookmarks({ search: isStr(search, 200) ? search : '' }) }));
  handle('bookmarks:add', (_e, url: string, title: string) => { if (isStr(url) && isStr(title, 500)) { addBookmark(url, title); broadcast('bookmarks:changed'); } return { ok: true }; });
  handle('bookmarks:remove', (_e, url: string) => { if (isStr(url)) { removeBookmark(url); broadcast('bookmarks:changed'); } return { ok: true }; });

  handle('history:list', (_e, search?: string) => ({ items: getHistory({ search: isStr(search, 200) ? search : '' }) }));
  handle('history:delete', (_e, url: string) => { if (isStr(url)) { deleteHistoryEntry(url); broadcast('history:changed'); } return { ok: true }; });
  handle('history:clear', (_e, sinceMs?: number) => { clearHistory(typeof sinceMs === 'number' ? sinceMs : undefined); broadcast('history:changed'); return { ok: true }; });

  handle('omnibox:suggest', (_e, input: string) => ({ items: isStr(input, 300) ? getSuggestions(input, 8) : [] }));

  handle('app:copy', (_e, text: string) => { if (isStr(text, 10000)) clipboard.writeText(text); return { ok: true }; });
  handle('app:openExternal', (_e, url: string) => {
    if (isStr(url) && /^https:\/\/(github\.com|duckduckgo\.com)\//i.test(url)) void shell.openExternal(url);
    return { ok: true };
  });
  handle('app:info', () => ({ version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node, platform: process.platform, dark: nativeTheme.shouldUseDarkColors }));
  handle('app:focusedWindow', () => ({ ok: !!focusedCtx() }));
}

function navigateAndRecord(ctx: NonNullable<ReturnType<typeof ctxFromSender>>, input: string): void {
  const engine = getSettings().searchEngine;
  if (!ctx.isPrivate && isSearchInput(input, engine)) recordSearchQuery(input);
  ctx.tabs.navigate(null, input);
}

function showAppMenu(ctx: NonNullable<ReturnType<typeof ctxFromSender>>): void {
  const lang = currentLang();
  const L = (k: Parameters<typeof t>[1]) => t(lang, k);
  const act = (a: ShortcutAction) => () => runAction(ctx, a, null);
  const menu = Menu.buildFromTemplate([
    { label: L('menu.newTab'), accelerator: 'CmdOrCtrl+T', click: act('new-tab') },
    { label: L('menu.newPrivate'), accelerator: 'CmdOrCtrl+Shift+N', click: act('new-private-window') },
    { type: 'separator' },
    { label: L('menu.history'), accelerator: 'CmdOrCtrl+H', click: act('history') },
    { label: L('menu.bookmarks'), click: () => openInternal(ctx, 'bookmarks') },
    { label: L('menu.downloads'), accelerator: 'CmdOrCtrl+J', click: act('downloads') },
    { type: 'separator' },
    { label: L('menu.find'), accelerator: 'CmdOrCtrl+F', click: act('find') },
    { label: L('menu.print'), accelerator: 'CmdOrCtrl+P', click: act('print') },
    {
      label: L('menu.zoom'),
      submenu: [
        { label: '+', accelerator: 'CmdOrCtrl+=', click: act('zoom-in') },
        { label: '−', accelerator: 'CmdOrCtrl+-', click: act('zoom-out') },
        { label: '100%', accelerator: 'CmdOrCtrl+0', click: act('zoom-reset') },
      ],
    },
    { type: 'separator' },
    { label: L('menu.settings'), accelerator: 'CmdOrCtrl+,', click: act('settings') },
    { type: 'separator' },
    { label: L('menu.quit'), click: () => app.quit() },
  ]);
  const [w] = ctx.win.getContentSize();
  menu.popup({ window: ctx.win, x: Math.max(0, w - 200), y: 84 });
}

function activeInfo(ctx: NonNullable<ReturnType<typeof ctxFromSender>>) {
  const state = ctx.tabs.getState();
  return state.tabs.find((t) => t.id === state.activeId) ?? null;
}

function showShieldMenu(ctx: NonNullable<ReturnType<typeof ctxFromSender>>): void {
  const lang = currentLang();
  const L = (k: Parameters<typeof t>[1]) => t(lang, k);
  const tab = activeInfo(ctx);
  const s = getSettings();
  const wc = tab ? ctx.tabs.contentsOf(tab.id) : null;
  const host = tab && /^https?:/i.test(tab.url) ? getHostname(tab.url) : null;
  const allowed = !!host && s.adblockAllowlist.some((d) => host === d || host.endsWith(`.${d}`));
  const items: Electron.MenuItemConstructorOptions[] = [
    { label: L('shield.blocked').replace('%n', String(wc ? blockedOnPage(wc.id) : 0)), enabled: false },
    { type: 'separator' },
  ];
  if (!s.adblockEnabled) items.push({ label: L('shield.off'), enabled: false });
  else if (host) {
    items.push({
      label: L('shield.siteOn'),
      type: 'checkbox',
      checked: !allowed,
      click: () => {
        const list = allowed ? s.adblockAllowlist.filter((d) => d !== host) : [...s.adblockAllowlist, host];
        updateSettings({ adblockAllowlist: list });
        ctx.tabs.reload(false);
      },
    });
  }
  items.push({ type: 'separator' }, { label: L('shield.settings'), click: () => openInternal(ctx, 'settings', 'privacy') });
  const [w] = ctx.win.getContentSize();
  Menu.buildFromTemplate(items).popup({ window: ctx.win, x: Math.max(0, w - 260), y: 84 });
}

function allowHttp(ctx: NonNullable<ReturnType<typeof ctxFromSender>>, url: string): void {
  const host = /^http:/i.test(url) ? getHostname(url) : null;
  if (!host) return;
  const s = getSettings();
  if (!s.httpsAllowlist.includes(host)) updateSettings({ httpsAllowlist: [...s.httpsAllowlist, host] });
  ctx.tabs.navigate(null, url);
}

function allowCert(ctx: NonNullable<ReturnType<typeof ctxFromSender>>, url: string): void {
  const host = /^https:/i.test(url) ? getHostname(url) : null;
  if (!host) return;
  allowCertException(host);
  ctx.tabs.navigate(null, url);
}
