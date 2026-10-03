/** Pure privacy rules (no Electron imports) so they are unit-testable. */
import { getDomain, getHostname } from 'tldts';
import type { CookiePolicy } from '../../shared/settings';
import { isLocalHost } from '../../shared/url';

// ---------- tracking parameters ----------
// Conservative: only well-known click/campaign identifiers. Functional params (ref, source, ...) are never touched.
const TRACKING_PARAMS = new Set([
  'fbclid', 'gclid', 'dclid', 'gbraid', 'wbraid', 'msclkid', 'yclid', 'twclid', 'igshid', 'srsltid',
  'mc_eid', 'mc_cid', '_hsenc', '_hsmi', 'vero_id', 'oly_enc_id', 'oly_anon_id',
]);
const TRACKING_PREFIXES = ['utm_', 'mtm_', 'piwik_', 'stm_'];

const isTrackingParam = (name: string) => {
  const n = name.toLowerCase();
  return TRACKING_PARAMS.has(n) || TRACKING_PREFIXES.some((p) => n.startsWith(p));
};

/** Returns the cleaned URL, or null when nothing needed removing. */
export function stripTrackingParams(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (!u.search) return null;
  let changed = false;
  for (const key of [...u.searchParams.keys()]) {
    if (isTrackingParam(key)) { u.searchParams.delete(key); changed = true; }
  }
  return changed ? u.toString() : null;
}

// ---------- first / third party ----------
/** Site identity: registrable domain, with private suffixes (github.io, blogspot.com) kept separate. */
export function siteOf(urlOrHost: string): string {
  const host = getHostname(urlOrHost) ?? urlOrHost;
  return getDomain(host, { allowPrivateDomains: true }) ?? host;
}

export function isThirdParty(requestUrl: string, topUrl: string | undefined): boolean {
  if (!topUrl || !/^https?:/i.test(topUrl)) return false;
  return siteOf(requestUrl) !== siteOf(topUrl);
}

// ---------- https upgrade ----------
export function hostMatches(host: string, list: readonly string[]): boolean {
  const h = host.toLowerCase();
  return list.some((d) => h === d || h.endsWith(`.${d}`));
}

export function shouldUpgradeToHttps(url: string, opts: { enabled: boolean; allowlist: readonly string[] }): boolean {
  if (!opts.enabled) return false;
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'http:') return false;
  if (u.port && u.port !== '80') return false; // only the default port is safe to guess
  if (isLocalHost(u.hostname)) return false;
  return !hostMatches(u.hostname, opts.allowlist);
}

export function upgradeUrl(url: string): string {
  const u = new URL(url);
  u.protocol = 'https:';
  return u.toString();
}

// ---------- cookies ----------
type Headers = Record<string, string | string[]>;

const cookieBlocked = (policy: CookiePolicy, thirdParty: boolean) => policy === 'block-all' || (policy === 'block-third-party' && thirdParty);

/** Drop Set-Cookie (any header-name casing). Returns new headers, or null when unchanged. */
export function filterSetCookie(headers: Headers, policy: CookiePolicy, thirdParty: boolean): Headers | null {
  if (!cookieBlocked(policy, thirdParty)) return null;
  const out: Headers = {};
  let changed = false;
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === 'set-cookie') { changed = true; continue; }
    out[k] = v;
  }
  return changed ? out : null;
}

/** Drop the outgoing Cookie header (any casing). Returns new headers, or null when unchanged. */
export function stripCookieHeader(headers: Headers, policy: CookiePolicy, thirdParty: boolean): Headers | null {
  if (!cookieBlocked(policy, thirdParty)) return null;
  const out: Headers = {};
  let changed = false;
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === 'cookie') { changed = true; continue; }
    out[k] = v;
  }
  return changed ? out : null;
}
