/**
 * TabManager: one real WebContentsView per tab. Tabs keep their own page, scroll position,
 * form state and history; switching only toggles visibility. The chrome UI receives snapshots.
 */
import { BrowserWindow, Menu, WebContentsView, clipboard, type WebContents } from 'electron';
import { resolveInput, isInternalUrl } from '../../shared/url';
import { t, type Lang, type MessageKey } from '../../shared/i18n';
import type { Settings } from '../../shared/settings';
import { log } from '../core/logger';
import { matchShortcut, type ShortcutAction } from './shortcuts';

export type SecurityState = 'secure' | 'insecure' | 'internal' | 'none';

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  audible: boolean;
  muted: boolean;
  pinned: boolean;
  security: SecurityState;
}

export interface TabsState {
  tabs: TabInfo[];
  activeId: number | null;
  canReopen: boolean;
}

export interface FindResult {
  activeMatchOrdinal: number;
  matches: number;
}

export interface SessionTab {
  url: string;
  title: string;
  pinned: boolean;
}

interface Entry {
  info: TabInfo;
  view: WebContentsView;
}

export interface TabManagerOptions {
  win: BrowserWindow;
  partition: string;
  preload: string;
  isPrivate: boolean;
  background: () => string;
  topInset: () => number;
  settings: () => Settings;
  lang: () => Lang;
  onState: (state: TabsState) => void;
  onAction: (action: ShortcutAction, sourceTabId: number | null) => void;
  onVisit: (url: string, title: string) => void;
  onFound: (r: FindResult) => void;
  onFullscreen: (on: boolean) => void;
}

const MAX_CLOSED = 25;
const NEWTAB = 'tekeli://newtab';

function securityOf(url: string): SecurityState {
  if (url.startsWith('tekeli://')) return 'internal';
  if (url.startsWith('https://')) return 'secure';
  if (url.startsWith('http://')) return 'insecure';
  return 'none';
}

let nextId = 1;

export class TabManager {
  private entries: Entry[] = [];
  private activeId: number | null = null;
  private closed: SessionTab[] = [];
  private emitQueued = false;
  private fullscreenInset = false;
  private destroyed = false;
  private byContents = new Map<number, number>();

  constructor(private o: TabManagerOptions) {}

  // ---------- queries ----------
  getState(): TabsState {
    return { tabs: this.entries.map((e) => ({ ...e.info })), activeId: this.activeId, canReopen: this.closed.length > 0 };
  }

  get activeContents(): WebContents | null {
    return this.entry(this.activeId)?.view.webContents ?? null;
  }

  tabIdFor(webContentsId: number): number | null {
    return this.byContents.get(webContentsId) ?? null;
  }

  contentsOf(id: number): WebContents | null {
    return this.entry(id)?.view.webContents ?? null;
  }

  private entry(id: number | null): Entry | undefined {
    return id === null ? undefined : this.entries.find((e) => e.info.id === id);
  }

  serialize(): { tabs: SessionTab[]; active: number } {
    const tabs = this.entries
      .filter((e) => !isInternalUrl(e.info.url) || e.info.url !== NEWTAB)
      .map((e) => ({ url: e.info.url, title: e.info.title, pinned: e.info.pinned }));
    const activeIdx = this.entries.filter((e) => !isInternalUrl(e.info.url) || e.info.url !== NEWTAB).findIndex((e) => e.info.id === this.activeId);
    return { tabs, active: Math.max(0, activeIdx) };
  }

  // ---------- layout ----------
  layout(): void {
    if (this.destroyed || this.o.win.isDestroyed()) return;
    const [w, h] = this.o.win.getContentSize();
    const top = this.fullscreenInset ? 0 : this.o.topInset();
    const bounds = { x: 0, y: top, width: Math.max(0, w), height: Math.max(0, h - top) };
    for (const e of this.entries) {
      e.view.setBounds(bounds);
      e.view.setVisible(e.info.id === this.activeId);
    }
  }

  setFullscreenInset(on: boolean): void {
    this.fullscreenInset = on;
    this.layout();
  }

  // ---------- lifecycle ----------
  create(rawUrl: string = NEWTAB, opts: { activate?: boolean; afterId?: number | null; focusOmnibox?: boolean } = {}): number {
    const settings = this.o.settings();
    const url = rawUrl === NEWTAB ? NEWTAB : resolveInput(rawUrl, settings.searchEngine) || NEWTAB;

    const view = new WebContentsView({
      webPreferences: {
        partition: this.o.partition,
        preload: this.o.preload,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: true,
      },
    });
    view.setBackgroundColor(this.o.background());
    const id = nextId++;
    const info: TabInfo = {
      id, url, title: '', favicon: null, loading: false, canGoBack: false, canGoForward: false,
      audible: false, muted: false, pinned: false, security: securityOf(url),
    };
    const entry: Entry = { info, view };

    const afterIdx = opts.afterId != null ? this.entries.findIndex((e) => e.info.id === opts.afterId) : -1;
    if (afterIdx >= 0) this.entries.splice(afterIdx + 1, 0, entry);
    else this.entries.push(entry);

    this.byContents.set(view.webContents.id, id);
    this.o.win.contentView.addChildView(view);
    view.setVisible(false);
    this.wire(entry);
    this.loadSafely(view.webContents, url);

    if (opts.activate !== false) this.activate(id);
    else this.layout();
    if (opts.focusOmnibox) this.o.onAction('focus-omnibox', id);
    this.queueEmit();
    return id;
  }

  activate(id: number): void {
    if (!this.entry(id)) return;
    this.activeId = id;
    this.layout();
    this.entry(id)?.view.webContents.focus();
    this.queueEmit();
  }

  close(id: number): void {
    const idx = this.entries.findIndex((e) => e.info.id === id);
    if (idx < 0) return;
    const [entry] = this.entries.splice(idx, 1);
    const { url, title, pinned } = entry.info;
    if (!this.o.isPrivate && !isInternalUrl(url) && url) {
      this.closed.unshift({ url, title, pinned });
      this.closed.length = Math.min(this.closed.length, MAX_CLOSED);
    }
    this.byContents.delete(entry.view.webContents.id);
    try { this.o.win.contentView.removeChildView(entry.view); } catch { /* window closing */ }
    try { entry.view.webContents.close(); } catch { /* already gone */ }

    if (this.activeId === id) {
      const next = this.entries[Math.min(idx, this.entries.length - 1)];
      this.activeId = next ? next.info.id : null;
    }
    this.layout();
    this.entry(this.activeId)?.view.webContents.focus();
    this.queueEmit();
  }

  reopenClosed(): void {
    const last = this.closed.shift();
    if (!last) return;
    const id = this.create(last.url, { activate: true });
    if (last.pinned) this.pin(id);
  }

  move(id: number, toIndex: number): void {
    const from = this.entries.findIndex((e) => e.info.id === id);
    if (from < 0) return;
    const to = Math.max(0, Math.min(this.entries.length - 1, toIndex));
    const [e] = this.entries.splice(from, 1);
    this.entries.splice(to, 0, e);
    this.queueEmit();
  }

  pin(id: number): void {
    const e = this.entry(id);
    if (!e) return;
    e.info.pinned = !e.info.pinned;
    const idx = this.entries.indexOf(e);
    this.entries.splice(idx, 1);
    const pinnedCount = this.entries.filter((x) => x.info.pinned).length;
    this.entries.splice(e.info.pinned ? 0 : pinnedCount, 0, e);
    this.queueEmit();
  }

  toggleMute(id: number): void {
    const e = this.entry(id);
    if (!e) return;
    const muted = !e.view.webContents.audioMuted;
    e.view.webContents.setAudioMuted(muted);
    e.info.muted = muted;
    this.queueEmit();
  }

  switchRelative(delta: 1 | -1): void {
    if (this.entries.length < 2 || this.activeId === null) return;
    const idx = this.entries.findIndex((e) => e.info.id === this.activeId);
    this.activate(this.entries[(idx + delta + this.entries.length) % this.entries.length].info.id);
  }

  switchToIndex(n: number): void {
    if (this.entries.length === 0) return;
    const e = n === 9 ? this.entries[this.entries.length - 1] : this.entries[n - 1];
    if (e) this.activate(e.info.id);
  }

  restore(tabs: SessionTab[], active: number): void {
    if (tabs.length === 0) return;
    const ids = tabs.map((tab) => {
      const id = this.create(tab.url, { activate: false });
      if (tab.pinned) this.pin(id);
      return id;
    });
    this.activate(ids[Math.min(Math.max(active, 0), ids.length - 1)]);
  }

  destroyAll(): void {
    this.destroyed = true;
    for (const e of this.entries) {
      try { e.view.webContents.close(); } catch { /* ignore */ }
    }
    this.entries = [];
    this.byContents.clear();
  }

  // ---------- navigation ----------
  navigate(id: number | null, input: string): void {
    const e = this.entry(id ?? this.activeId);
    if (!e) return;
    const url = resolveInput(input, this.o.settings().searchEngine);
    if (!url) return;
    this.loadSafely(e.view.webContents, url);
  }

  back(): void { const c = this.activeContents; if (c?.navigationHistory.canGoBack()) c.navigationHistory.goBack(); }
  forward(): void { const c = this.activeContents; if (c?.navigationHistory.canGoForward()) c.navigationHistory.goForward(); }
  reload(hard = false): void { const c = this.activeContents; if (!c) return; if (hard) c.reloadIgnoringCache(); else c.reload(); }
  stop(): void { this.activeContents?.stop(); }
  home(): void { this.navigate(this.activeId, NEWTAB); }

  zoom(dir: 'in' | 'out' | 'reset'): void {
    const c = this.activeContents;
    if (!c) return;
    if (dir === 'reset') c.setZoomLevel(0);
    else c.setZoomLevel(Math.max(-3, Math.min(5, c.getZoomLevel() + (dir === 'in' ? 0.5 : -0.5))));
  }

  find(text: string, forward = true, findNext = false): void {
    const c = this.activeContents;
    if (!c || !text) return;
    c.findInPage(text, { forward, findNext });
  }

  stopFind(): void { this.activeContents?.stopFindInPage('clearSelection'); }
  print(): void { this.activeContents?.print(); }
  devtools(): void {
    const c = this.activeContents;
    if (!c) return;
    if (c.isDevToolsOpened()) c.closeDevTools();
    else c.openDevTools({ mode: 'detach' });
  }

  private loadSafely(contents: WebContents, url: string): void {
    contents.loadURL(url).catch((err: NodeJS.ErrnoException) => {
      // ERR_ABORTED (-3) is a normal result of a superseded navigation.
      if (err?.code !== 'ERR_ABORTED') log.warn(`[tabs] load failed: ${String(err?.message ?? err).split('\n')[0]}`);
    });
  }

  // ---------- events ----------
  private queueEmit(): void {
    if (this.emitQueued || this.destroyed) return;
    this.emitQueued = true;
    setImmediate(() => {
      this.emitQueued = false;
      if (!this.destroyed) this.o.onState(this.getState());
    });
  }

  private sync(entry: Entry): void {
    const c = entry.view.webContents;
    if (c.isDestroyed()) return;
    const url = (c.getURL() || entry.info.url).replace(/^(tekeli:\/\/[^/?#]+)\/(?=$|[?#])/, '$1');
    entry.info.url = url;
    entry.info.security = securityOf(url);
    entry.info.canGoBack = c.navigationHistory.canGoBack();
    entry.info.canGoForward = c.navigationHistory.canGoForward();
    entry.info.audible = c.isCurrentlyAudible();
    this.queueEmit();
  }

  private wire(entry: Entry): void {
    const c = entry.view.webContents;
    const info = entry.info;

    c.on('did-start-loading', () => { info.loading = true; this.queueEmit(); });
    c.on('did-stop-loading', () => { info.loading = false; this.sync(entry); });
    c.on('did-navigate', () => {
      info.favicon = null;
      this.sync(entry);
    });
    c.on('did-navigate-in-page', (_e, _url, isMainFrame) => { if (isMainFrame) this.sync(entry); });
    c.on('page-title-updated', (_e, title) => {
      info.title = title;
      this.queueEmit();
    });
    c.on('page-favicon-updated', (_e, favicons) => {
      info.favicon = favicons.find((f) => /^https?:|^data:image\//i.test(f)) ?? null;
      this.queueEmit();
    });
    c.on('audio-state-changed', () => { info.audible = c.isCurrentlyAudible(); this.queueEmit(); });
    c.on('did-finish-load', () => {
      if (!this.o.isPrivate && /^https?:/i.test(info.url)) this.o.onVisit(info.url, c.getTitle());
    });
    c.on('did-fail-load', (_e, code, desc, failedUrl, isMainFrame) => {
      if (!isMainFrame || code === -3 || failedUrl.startsWith('tekeli://')) return;
      const q = new URLSearchParams({ kind: 'load', code: String(code), desc, url: failedUrl });
      this.loadSafely(c, `tekeli://error?${q.toString()}`);
    });
    c.on('render-process-gone', (_e, details) => {
      log.warn(`[tabs] renderer gone: ${details.reason}`);
      if (details.reason === 'clean-exit') return;
      const q = new URLSearchParams({ kind: 'crash', url: info.url });
      this.loadSafely(c, `tekeli://error?${q.toString()}`);
    });
    c.on('found-in-page', (_e, r) => this.o.onFound({ activeMatchOrdinal: r.activeMatchOrdinal, matches: r.matches }));
    c.on('enter-html-full-screen', () => { this.o.onFullscreen(true); });
    c.on('leave-html-full-screen', () => { this.o.onFullscreen(false); });

    // Web content must never navigate itself into the app's own origin.
    const guard = (event: { preventDefault(): void }, target: string) => {
      const toInternal = target.startsWith('tekeli://');
      const fromInternal = c.getURL().startsWith('tekeli://');
      if (toInternal && !fromInternal) { event.preventDefault(); return; }
      if (/^(file|javascript|data|vbscript):/i.test(target)) event.preventDefault();
    };
    c.on('will-navigate', (e, target) => guard(e, target));
    c.on('will-redirect', (e, target) => guard(e, target));
    c.on('will-frame-navigate', (e) => { if (e.url.startsWith('tekeli://') && !c.getURL().startsWith('tekeli://')) e.preventDefault(); });

    c.setWindowOpenHandler(({ url, disposition }) => {
      if (/^https?:\/\//i.test(url) || url === 'about:blank') {
        if (url !== 'about:blank') this.create(url, { activate: disposition !== 'background-tab', afterId: info.id });
      }
      return { action: 'deny' };
    });

    c.on('before-input-event', (event, input) => {
      const action = matchShortcut(input);
      if (!action) return;
      if (action === 'escape') return; // let pages handle Esc; chrome also listens separately
      event.preventDefault();
      this.o.onAction(action, info.id);
    });

    c.on('context-menu', (_e, params) => this.showContextMenu(entry, params));
  }

  private showContextMenu(entry: Entry, params: Electron.ContextMenuParams): void {
    const c = entry.view.webContents;
    const lang = this.o.lang();
    const L = (k: MessageKey) => t(lang, k);
    const items: Electron.MenuItemConstructorOptions[] = [];
    const sep = (): void => { if (items.length && items[items.length - 1].type !== 'separator') items.push({ type: 'separator' }); };

    if (params.isEditable) {
      items.push(
        { label: L('ctx.cut'), role: 'cut', enabled: params.editFlags.canCut },
        { label: L('ctx.copy'), role: 'copy', enabled: params.editFlags.canCopy },
        { label: L('ctx.paste'), role: 'paste', enabled: params.editFlags.canPaste },
        { label: L('ctx.selectAll'), role: 'selectAll' },
      );
    } else if (params.selectionText) {
      items.push({ label: L('ctx.copy'), role: 'copy' });
      const short = params.selectionText.trim().slice(0, 30);
      items.push({
        label: L('ctx.search').replace('%s', short),
        click: () => this.create(params.selectionText.trim(), { activate: true, afterId: entry.info.id }),
      });
    }

    if (params.linkURL && /^https?:/i.test(params.linkURL)) {
      sep();
      items.push(
        { label: L('ctx.openLink'), click: () => this.create(params.linkURL, { activate: false, afterId: entry.info.id }) },
        { label: L('ctx.copyLink'), click: () => clipboard.writeText(params.linkURL) },
      );
    }

    if (params.mediaType === 'image' && /^https?:/i.test(params.srcURL)) {
      sep();
      items.push(
        { label: L('ctx.openImage'), click: () => this.create(params.srcURL, { activate: true, afterId: entry.info.id }) },
        { label: L('ctx.saveImage'), click: () => c.downloadURL(params.srcURL) },
        { label: L('ctx.copyImageUrl'), click: () => clipboard.writeText(params.srcURL) },
      );
    }

    if (!params.isEditable && !params.selectionText && !params.linkURL) {
      sep();
      items.push(
        { label: L('nav.back'), enabled: c.navigationHistory.canGoBack(), click: () => c.navigationHistory.goBack() },
        { label: L('nav.forward'), enabled: c.navigationHistory.canGoForward(), click: () => c.navigationHistory.goForward() },
        { label: L('nav.reload'), click: () => c.reload() },
      );
    }

    if (/^https?:/i.test(entry.info.url)) {
      sep();
      items.push({ label: L('ctx.viewSource'), click: () => this.create(`view-source:${entry.info.url}`, { activate: true, afterId: entry.info.id }) });
    }
    sep();
    items.push({ label: L('ctx.inspect'), click: () => { c.inspectElement(params.x, params.y); if (!c.isDevToolsOpened()) c.openDevTools({ mode: 'detach' }); } });

    Menu.buildFromTemplate(items).popup({ window: this.o.win });
  }
}
