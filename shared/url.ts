import type { SearchEngineId } from './settings';

export const INTERNAL_SCHEME = 'tekeli:';
export const INTERNAL_PAGES = ['newtab', 'settings', 'history', 'bookmarks', 'downloads', 'error'] as const;
export type InternalPage = (typeof INTERNAL_PAGES)[number];

const SEARCH_URLS: Record<SearchEngineId, (q: string) => string> = {
  duckduckgo: (q) => `https://duckduckgo.com/?q=${q}`,
  google: (q) => `https://www.google.com/search?q=${q}`,
  bing: (q) => `https://www.bing.com/search?q=${q}`,
};

export function buildSearchUrl(engine: SearchEngineId, query: string): string {
  return SEARCH_URLS[engine](encodeURIComponent(query));
}

const hasScheme = (s: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(s);

export function isIPv4(host: string): boolean {
  const parts = host.split('.');
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** Hosts where https upgrade makes no sense (local dev, LAN). */
export function isLocalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '::1') return true;
  if (!isIPv4(h)) return false;
  const [a, b] = h.split('.').map(Number);
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

function looksLikeHost(input: string): boolean {
  if (/\s/.test(input)) return false;
  const host = input.split(/[/?#]/)[0].replace(/:\d+$/, '');
  if (!host) return false;
  if (host === 'localhost' || isIPv4(host)) return true;
  if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) return false;
  const labels = host.split('.');
  if (labels.some((l) => !/^[a-z0-9-]+$/i.test(l) || l.startsWith('-') || l.endsWith('-'))) return false;
  return /^[a-z]{2,}$/i.test(labels[labels.length - 1]);
}

/** Turn whatever the user typed into a navigable URL. Returns '' for empty input. */
export function resolveInput(raw: string, engine: SearchEngineId): string {
  const input = raw.trim();
  if (!input) return '';
  if (/^(javascript|data|file|vbscript):/i.test(input)) return buildSearchUrl(engine, input);
  if (input.startsWith('tekeli://') || /^view-source:/i.test(input)) return input;
  if (hasScheme(input)) return input;
  if (looksLikeHost(input)) {
    const host = input.split(/[/?#]/)[0].replace(/:\d+$/, '');
    return `${isLocalHost(host) ? 'http' : 'https'}://${input}`;
  }
  return buildSearchUrl(engine, input);
}

export function isInternalUrl(url: string): boolean {
  return url.startsWith('tekeli://');
}

export function internalPageOf(url: string): InternalPage | null {
  if (!isInternalUrl(url)) return null;
  try {
    const host = new URL(url).hostname;
    return (INTERNAL_PAGES as readonly string[]).includes(host) ? (host as InternalPage) : null;
  } catch {
    return null;
  }
}

/** Short text for the omnibox: hide scheme + www for normal pages, show tekeli:// as is. */
export function displayUrl(url: string): string {
  if (!url || url === 'tekeli://newtab') return '';
  if (isInternalUrl(url)) return url;
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      const rest = `${u.host.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname}${u.search}`;
      return u.protocol === 'http:' ? `http://${rest}` : rest;
    }
  } catch { /* fall through */ }
  return url;
}

/** True when the omnibox text would be sent to the search engine (not an address). */
export function isSearchInput(raw: string, engine: SearchEngineId): boolean {
  const input = raw.trim();
  return input !== '' && resolveInput(input, engine) === buildSearchUrl(engine, input);
}
