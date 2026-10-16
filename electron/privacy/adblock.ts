/**
 * Ad & tracker blocking on the Ghostery engine (EasyList, EasyPrivacy, uBlock filters, ...).
 * Network matching is called from the request pipeline; cosmetic filtering/scriptlets reach pages
 * through Ghostery's frame preload + the two IPC handlers below.
 */
import { app, ipcMain, type OnBeforeRequestListenerDetails } from 'electron';
import { FiltersEngine, Request } from '@ghostery/adblocker';
import { getDomain, getHostname } from 'tldts';
import fs from 'node:fs';
import path from 'node:path';
import { dbGet, dbRun } from '../db';
import { log } from '../core/logger';
import { getSettings } from '../app/settingsStore';
import { hostMatches } from './rules';

let engine: FiltersEngine | null = null;
let refreshTimer: NodeJS.Timeout | null = null;
let totalBlocked = 0;
let totalDirty = false;
const pageCounts = new Map<number, number>(); // webContents id -> blocked on the current page

const TYPE_MAP: Record<string, string> = {
  mainFrame: 'main_frame', subFrame: 'sub_frame', stylesheet: 'stylesheet', script: 'script', image: 'image',
  font: 'font', object: 'object', xhr: 'xmlhttprequest', ping: 'ping', cspReport: 'csp_report', media: 'media',
  webSocket: 'websocket', other: 'other',
};

const cachePath = () => path.join(app.getPath('userData'), 'filters', 'ads-tracking.bin');

async function buildEngine(): Promise<FiltersEngine> {
  fs.mkdirSync(path.dirname(cachePath()), { recursive: true });
  return FiltersEngine.fromPrebuiltAdsAndTracking(fetch, {
    path: cachePath(),
    read: (p) => fs.promises.readFile(p),
    write: (p, buf) => fs.promises.writeFile(p, buf),
  });
}

export async function initAdblock(): Promise<void> {
  totalBlocked = Number(dbGet<{ value: string }>("SELECT value FROM meta WHERE key = 'blocked_total'")?.value ?? 0) || 0;
  setInterval(() => {
    if (!totalDirty) return;
    totalDirty = false;
    try { dbRun("INSERT INTO meta (key, value) VALUES ('blocked_total', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [String(totalBlocked)]); } catch { /* db closing */ }
  }, 30_000).unref();

  registerCosmeticIpc();
  try {
    engine = await buildEngine();
    log.info('[adblock] engine ready');
  } catch (err) {
    log.error('[adblock] engine load failed (blocking disabled until next refresh):', err);
  }
  // Refresh the lists daily in the background; keep the old engine if a refresh fails.
  refreshTimer = setInterval(() => {
    buildEngine().then((e) => { engine = e; log.info('[adblock] lists refreshed'); }).catch((err) => log.warn('[adblock] refresh failed:', err));
  }, 24 * 3600 * 1000);
  refreshTimer.unref();
}

export const isAdblockReady = (): boolean => engine !== null;

export function isSiteAllowlisted(topUrl: string | undefined): boolean {
  const host = topUrl ? getHostname(topUrl) : null;
  return !!host && hostMatches(host, getSettings().adblockAllowlist);
}

export type BlockDecision = { cancel: true } | { redirectURL: string } | null;

export function matchRequest(details: OnBeforeRequestListenerDetails, topUrl: string | undefined): BlockDecision {
  if (!engine) return null;
  const request = Request.fromRawDetails({
    url: details.url,
    sourceUrl: topUrl || details.referrer || undefined,
    type: (TYPE_MAP[details.resourceType] ?? 'other') as never,
    requestId: String(details.id),
  });
  if (request.isMainFrame()) return null;
  const { match, redirect } = engine.match(request);
  if (redirect) return { redirectURL: redirect.dataUrl };
  return match ? { cancel: true } : null;
}

const blockedListeners = new Set<() => void>();
let notifyTimer: NodeJS.Timeout | null = null;
export function onBlockedChanged(fn: () => void): () => void {
  blockedListeners.add(fn);
  return () => blockedListeners.delete(fn);
}

export function noteBlocked(webContentsId: number | undefined): void {
  totalBlocked++;
  if (!notifyTimer) {
    notifyTimer = setTimeout(() => { notifyTimer = null; blockedListeners.forEach((fn) => fn()); }, 400);
  }
  totalDirty = true;
  if (webContentsId !== undefined) pageCounts.set(webContentsId, (pageCounts.get(webContentsId) ?? 0) + 1);
}

export const resetPageCount = (webContentsId: number | undefined): void => { if (webContentsId !== undefined) pageCounts.delete(webContentsId); };
export const blockedOnPage = (webContentsId: number): number => pageCounts.get(webContentsId) ?? 0;
export const blockedTotal = (): number => totalBlocked;

// ---------- cosmetic filtering (CSS hiding + scriptlets) ----------
let cosmeticRegistered = false;
function registerCosmeticIpc(): void {
  if (cosmeticRegistered) return;
  cosmeticRegistered = true;

  ipcMain.handle('@ghostery/adblocker/is-mutation-observer-enabled', () => true);
  ipcMain.handle('@ghostery/adblocker/inject-cosmetic-filters', async (event, url: string, msg?: { classes?: string[]; hrefs?: string[]; ids?: string[]; lifecycle?: string }) => {
    if (!engine || typeof url !== 'string' || !/^https?:/i.test(url)) return;
    const s = getSettings();
    if (!s.adblockEnabled) return;
    const hostname = getHostname(url) ?? '';
    if (hostMatches(hostname, s.adblockAllowlist)) return;
    if (!s.adblockYoutube && /(^|\.)youtube\.com$/.test(hostname)) return;

    const first = msg === undefined;
    const { active, styles, scripts } = engine.getCosmeticsFilters({
      url,
      hostname,
      domain: getDomain(hostname) ?? '',
      classes: msg?.classes,
      hrefs: msg?.hrefs,
      ids: msg?.ids,
      getBaseRules: first,
      getInjectionRules: first,
      getExtendedRules: false,
      getRulesFromHostname: first,
      getRulesFromDOM: !first,
      callerContext: { frameId: event.frameId, processId: event.processId, lifecycle: msg?.lifecycle },
    });
    if (active === false) return;
    if (styles.length > 0) void event.sender.insertCSS(styles, { cssOrigin: 'user' });
    for (const script of scripts) {
      try { void event.sender.executeJavaScript(script, true); } catch (err) { log.warn('[adblock] scriptlet failed:', err); }
    }
  });
}
