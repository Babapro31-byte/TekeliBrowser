/** Window layer: BrowserWindow + chrome UI (React) + TabManager + action execution. */
import { BrowserWindow, app, nativeTheme, screen, session, type WebContents } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { internalPageOf } from '../../shared/url';
import { log } from '../core/logger';
import { trustWebContents, untrustWebContents } from '../core/ipc';
import { addBookmark, addHistory, isBookmarked, removeBookmark } from '../data/store';
import { getSettings, currentTheme, currentLang, onSettingsChanged, THEME_COLORS } from './settingsStore';
import { matchShortcut, type ShortcutAction } from './shortcuts';
import { TabManager, type SessionTab, type TabsState } from './tabs';
import { configureSession } from './sessions';
import { onBlockedChanged } from '../privacy/adblock';

export interface WindowCtx {
  win: BrowserWindow;
  tabs: TabManager;
  isPrivate: boolean;
  find: { open: boolean };
}

const TAB_STRIP = 40;
const TOOLBAR = 44;
const BOOKMARKS_BAR = 32;
const FIND_BAR = 40;
const contexts = new Map<number, WindowCtx>(); // key: chrome webContents id
let primary: WindowCtx | null = null;
let saveTimer: NodeJS.Timeout | null = null;
let quitting = false;
let privateCounter = 0;

const preloadPath = () => path.join(__dirname, 'preload-app.cjs');
const statePath = () => path.join(app.getPath('userData'), 'window-state.json');
const sessionPath = () => path.join(app.getPath('userData'), 'session.json');

export const chromeInset = () => TAB_STRIP + TOOLBAR + (getSettings().showBookmarksBar ? BOOKMARKS_BAR : 0);
export const allContexts = () => [...contexts.values()];

export function ctxFromSender(sender: WebContents): WindowCtx | null {
  const direct = contexts.get(sender.id);
  if (direct) return direct;
  for (const ctx of contexts.values()) if (ctx.tabs.tabIdFor(sender.id) !== null) return ctx;
  return null;
}

export function focusedCtx(): WindowCtx | null {
  const w = BrowserWindow.getFocusedWindow();
  if (w) for (const ctx of contexts.values()) if (ctx.win === w) return ctx;
  return primary ?? allContexts()[0] ?? null;
}

/** Send to every window's chrome UI and to every tab that currently shows an internal page. */
export function broadcast(channel: string, payload?: unknown): void {
  for (const ctx of contexts.values()) {
    if (!ctx.win.isDestroyed()) ctx.win.webContents.send(channel, payload);
    for (const s of ctx.tabs.getState().tabs) {
      if (!s.url.startsWith('tekeli://')) continue;
      const c = ctx.tabs.contentsOf(s.id);
      if (c && !c.isDestroyed()) c.send(channel, payload);
    }
  }
}

function loadWindowState(): { x?: number; y?: number; width: number; height: number; maximized: boolean } {
  const fallback = { width: 1360, height: 860, maximized: false };
  try {
    const s = JSON.parse(fs.readFileSync(statePath(), 'utf-8'));
    const area = screen.getDisplayMatching({ x: s.x ?? 0, y: s.y ?? 0, width: s.width, height: s.height }).workArea;
    const visible = s.x >= area.x - 40 && s.y >= area.y - 40 && s.x < area.x + area.width - 100 && s.y < area.y + area.height - 100;
    return {
      width: Math.max(640, Number(s.width) || fallback.width),
      height: Math.max(480, Number(s.height) || fallback.height),
      ...(visible ? { x: s.x, y: s.y } : {}),
      maximized: !!s.maximized,
    };
  } catch {
    return fallback;
  }
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const b = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(statePath(), JSON.stringify({ ...b, maximized: win.isMaximized() }));
  } catch (err) {
    log.warn('[window] save state failed:', err);
  }
}

function writeSession(ctx: WindowCtx): void {
  if (ctx !== primary || ctx.isPrivate) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveSessionNow(), 1000);
}

export function saveSessionNow(): void {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!primary || primary.win.isDestroyed()) return;
  try {
    fs.writeFileSync(sessionPath(), JSON.stringify(primary.tabs.serialize()));
  } catch (err) {
    log.warn('[window] save session failed:', err);
  }
}

export function readSession(): { tabs: SessionTab[]; active: number } | null {
  try {
    const raw = JSON.parse(fs.readFileSync(sessionPath(), 'utf-8'));
    if (!Array.isArray(raw.tabs)) return null;
    const tabs: SessionTab[] = raw.tabs
      .filter((t: unknown): t is SessionTab => typeof t === 'object' && t !== null && typeof (t as SessionTab).url === 'string')
      .filter((t: SessionTab) => /^https?:|^tekeli:/i.test(t.url))
      .slice(0, 100)
      .map((t: SessionTab) => ({ url: t.url, title: String(t.title ?? ''), pinned: !!t.pinned }));
    return tabs.length ? { tabs, active: Number(raw.active) || 0 } : null;
  } catch {
    return null;
  }
}

export function createWindow(opts: { isPrivate?: boolean } = {}): WindowCtx {
  const isPrivate = !!opts.isPrivate;
  const theme = currentTheme();
  const colors = THEME_COLORS[theme];
  const st = isPrivate ? { width: 1200, height: 800, maximized: false } : loadWindowState();

  const win = new BrowserWindow({
    ...(('x' in st && st.x !== undefined) ? { x: st.x, y: st.y } : {}),
    width: st.width,
    height: st.height,
    minWidth: 640,
    minHeight: 480,
    show: false,
    backgroundColor: colors.chrome,
    title: isPrivate ? 'Tekeli — Private' : 'Tekeli',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: colors.chrome, symbolColor: colors.symbol, height: TAB_STRIP },
    webPreferences: {
      preload: preloadPath(),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
    },
  });

  const partition = isPrivate ? `private-${Date.now()}-${privateCounter++}` : 'persist:web';
  if (isPrivate) configureSession(session.fromPartition(partition));
  let ctx!: WindowCtx;

  const tabs = new TabManager({
    win,
    partition,
    preload: preloadPath(),
    isPrivate,
    background: () => THEME_COLORS[currentTheme()].app,
    topInset: () => chromeInset() + (ctx?.find.open ? FIND_BAR : 0),
    settings: getSettings,
    lang: currentLang,
    onState: (state: TabsState) => {
      if (!win.isDestroyed()) win.webContents.send('tabs:state', state);
      writeSession(ctx);
    },
    onAction: (action, tabId) => runAction(ctx, action, tabId),
    onVisit: (url, title) => { try { addHistory(url, title); } catch (err) { log.warn('[history] add failed:', err); } },
    onFound: (r) => { if (!win.isDestroyed()) win.webContents.send('find:result', r); },
    onFullscreen: (on) => { win.setFullScreen(on); tabs.setFullscreenInset(on); },
  });

  ctx = { win, tabs, isPrivate, find: { open: false } };
  const chromeId = win.webContents.id;
  const offBlocked = onBlockedChanged(() => tabs.refreshAll());
  contexts.set(chromeId, ctx);
  if (!primary && !isPrivate) primary = ctx;
  trustWebContents(chromeId);

  const relayout = () => tabs.layout();
  win.on('resize', relayout);
  win.on('maximize', relayout);
  win.on('unmaximize', relayout);
  win.on('enter-full-screen', relayout);
  win.on('leave-full-screen', relayout);
  win.on('restore', relayout);

  win.webContents.on('before-input-event', (event, input) => {
    const action = matchShortcut(input);
    if (!action || action === 'escape') return;
    event.preventDefault();
    runAction(ctx, action, null);
  });

  // The chrome window itself must never navigate away from the app.
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('tekeli://chrome') && !(process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL))) e.preventDefault(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.once('ready-to-show', () => {
    if (st.maximized) win.maximize();
    win.show();
  });
  setTimeout(() => { if (!win.isDestroyed() && !win.isVisible()) win.show(); }, 6000);

  win.on('close', () => { if (!isPrivate) saveWindowState(win); if (ctx === primary && !quitting) saveSessionNow(); });
  win.on('closed', () => {
    contexts.delete(chromeId);
    untrustWebContents(chromeId);
    offBlocked();
    tabs.destroyAll();
    if (primary === ctx) primary = allContexts().find((c) => !c.isPrivate) ?? null;
  });

  void win.loadURL(`tekeli://chrome${isPrivate ? '?private=1' : ''}`);
  return ctx;
}

export function markQuitting(): void { quitting = true; }

// ---------- actions ----------
const INTERNAL_BASE = (page: string) => `tekeli://${page}`;

export function openInternal(ctx: WindowCtx, page: 'settings' | 'history' | 'bookmarks' | 'downloads', sub = ''): void {
  const state = ctx.tabs.getState();
  const existing = state.tabs.find((t) => internalPageOf(t.url) === page);
  const url = `${INTERNAL_BASE(page)}${sub ? `/${sub}` : ''}`;
  if (existing) {
    ctx.tabs.activate(existing.id);
    if (sub && existing.url !== url) ctx.tabs.navigate(existing.id, url);
  } else {
    ctx.tabs.create(url, { activate: true, afterId: state.activeId });
  }
}

export function toggleBookmark(ctx: WindowCtx): void {
  const active = ctx.tabs.getState().tabs.find((t) => t.id === ctx.tabs.getState().activeId);
  if (!active || !/^https?:/i.test(active.url) || ctx.isPrivate) return;
  if (isBookmarked(active.url)) removeBookmark(active.url);
  else addBookmark(active.url, active.title);
  broadcast('bookmarks:changed');
}

export function runAction(ctx: WindowCtx, action: ShortcutAction, _tabId: number | null): void {
  const { tabs, win } = ctx;
  switch (action) {
    case 'new-tab': tabs.create('tekeli://newtab', { activate: true, afterId: tabs.getState().activeId, focusOmnibox: true }); break;
    case 'close-tab': {
      const s = tabs.getState();
      if (s.tabs.length <= 1) win.close();
      else if (s.activeId !== null) tabs.close(s.activeId);
      break;
    }
    case 'reopen-tab': tabs.reopenClosed(); break;
    case 'new-window': createWindow().tabs.create('tekeli://newtab', { focusOmnibox: true }); break;
    case 'new-private-window': createWindow({ isPrivate: true }).tabs.create('tekeli://newtab', { focusOmnibox: true }); break;
    case 'focus-omnibox': win.webContents.focus(); win.webContents.send('chrome:focus-omnibox'); break;
    case 'find': win.webContents.focus(); win.webContents.send('chrome:open-find'); break;
    case 'bookmark': toggleBookmark(ctx); break;
    case 'history': openInternal(ctx, 'history'); break;
    case 'downloads': openInternal(ctx, 'downloads'); break;
    case 'settings': openInternal(ctx, 'settings'); break;
    case 'print': tabs.print(); break;
    case 'reload': tabs.reload(false); break;
    case 'hard-reload': tabs.reload(true); break;
    case 'stop': tabs.stop(); break;
    case 'back': tabs.back(); break;
    case 'forward': tabs.forward(); break;
    case 'zoom-in': tabs.zoom('in'); break;
    case 'zoom-out': tabs.zoom('out'); break;
    case 'zoom-reset': tabs.zoom('reset'); break;
    case 'next-tab': tabs.switchRelative(1); break;
    case 'prev-tab': tabs.switchRelative(-1); break;
    case 'fullscreen': win.setFullScreen(!win.isFullScreen()); break;
    case 'devtools': tabs.devtools(); break;
    case 'escape': break;
    default:
      if (action.startsWith('tab-')) tabs.switchToIndex(Number(action.slice(4)));
  }
}

// ---------- settings side effects ----------
export function initWindowSettingsEffects(): void {
  onSettingsChanged((s, changed) => {
    const theme = currentTheme();
    const colors = THEME_COLORS[theme];
    for (const ctx of contexts.values()) {
      if (ctx.win.isDestroyed()) continue;
      if (changed.includes('theme')) {
        ctx.win.setBackgroundColor(colors.chrome);
        try { ctx.win.setTitleBarOverlay({ color: colors.chrome, symbolColor: colors.symbol, height: TAB_STRIP }); } catch { /* not supported on this platform */ }
      }
      if (changed.includes('showBookmarksBar')) ctx.tabs.layout();
    }
    broadcast('settings:changed', { settings: s, theme, lang: currentLang() });
  });
  nativeTheme.on('updated', () => {
    if (getSettings().theme === 'system') broadcast('settings:changed', { settings: getSettings(), theme: currentTheme(), lang: currentLang() });
  });
}
