/**
 * One webRequest dispatcher per session. Electron keeps a single listener per event, so every
 * privacy feature runs inside these handlers in a fixed order instead of overwriting each other.
 */
import type { Session } from 'electron';
import { getSettings } from '../app/settingsStore';
import { isSiteAllowlisted, matchRequest, noteBlocked, resetPageCount } from './adblock';
import { filterSetCookie, isThirdParty, shouldUpgradeToHttps, stripCookieHeader, stripTrackingParams, upgradeUrl } from './rules';

const FILTER = { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] };

// https URL we redirected to -> original http URL (used to show the HTTPS warning if the upgrade fails)
const upgrades = new Map<string, { from: string; at: number }>();
// webContents id -> last upgraded main-frame navigation (covers redirects that change the final URL)
const upgradeByTab = new Map<number, { from: string; at: number }>();
const UPGRADE_TTL = 60_000;

export function takeUpgradeOrigin(failedUrl: string, webContentsId?: number): string | null {
  const now = Date.now();
  for (const [k, v] of upgrades) if (now - v.at > UPGRADE_TTL) upgrades.delete(k);
  const key = normalize(failedUrl);
  const hit = upgrades.get(key);
  if (hit) { upgrades.delete(key); return hit.from; }
  const byTab = webContentsId !== undefined ? upgradeByTab.get(webContentsId) : undefined;
  if (byTab && now - byTab.at < 15_000) { upgradeByTab.delete(webContentsId as number); return byTab.from; }
  return null;
}

function normalize(url: string): string {
  try { return new URL(url).toString(); } catch { return url; }
}

const topUrlOf = (d: { webContents?: Electron.WebContents; referrer?: string }): string | undefined => {
  try { return d.webContents?.getURL() || d.referrer || undefined; } catch { return d.referrer || undefined; }
};

export function installPipeline(ses: Session): void {
  ses.webRequest.onBeforeRequest(FILTER, (details, callback) => {
    const s = getSettings();

    if (details.resourceType === 'mainFrame') {
      if (shouldUpgradeToHttps(details.url, { enabled: s.httpsOnly, allowlist: s.httpsAllowlist })) {
        const to = upgradeUrl(details.url);
        upgrades.set(normalize(to), { from: details.url, at: Date.now() });
        if (details.webContentsId !== undefined) upgradeByTab.set(details.webContentsId, { from: details.url, at: Date.now() });
        callback({ redirectURL: to });
        return;
      }
      if (details.method === 'GET') {
        const clean = stripTrackingParams(details.url);
        if (clean) { callback({ redirectURL: clean }); return; }
      }
      resetPageCount(details.webContentsId);
      callback({});
      return;
    }

    if (s.adblockEnabled) {
      const top = topUrlOf(details);
      if (!isSiteAllowlisted(top)) {
        const decision = matchRequest(details, top);
        if (decision) {
          noteBlocked(details.webContentsId);
          callback(decision);
          return;
        }
      }
    }
    callback({});
  });

  ses.webRequest.onBeforeSendHeaders(FILTER, (details, callback) => {
    const s = getSettings();
    let headers = details.requestHeaders;
    if (s.gpc) headers = { ...headers, 'Sec-GPC': '1' };
    const third = details.resourceType !== 'mainFrame' && isThirdParty(details.url, topUrlOf(details));
    const stripped = stripCookieHeader(headers, s.cookiePolicy, third);
    callback({ requestHeaders: stripped ?? headers });
  });

  ses.webRequest.onHeadersReceived(FILTER, (details, callback) => {
    const s = getSettings();
    const third = details.resourceType !== 'mainFrame' && isThirdParty(details.url, topUrlOf(details));
    const filtered = details.responseHeaders ? filterSetCookie(details.responseHeaders, s.cookiePolicy, third) : null;
    callback(filtered ? { responseHeaders: filtered } : {});
  });
}
