/**
 * TekeliBrowser Professional Ad Blocker Engine
 * Optimized for performance
 */

import { session } from 'electron';

// Ad blocking statistics
let totalBlocked = 0;
let sessionBlocked = 0;

// Pre-compiled Sets for O(1) lookup (much faster than array.includes)
const WHITELIST_SET = new Set([
  'googlevideo.com',
  'ytimg.com',
  'ggpht.com',
  'gstatic.com',
  'googleapis.com',
  'accounts.google.com',
  'play.google.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'jsdelivr.net',
  'cloudflare.com',
  'akamaized.net',
  'fastly.net'
]);

const AD_DOMAINS_SET = new Set([
  'googlesyndication.com',
  'googleadservices.com',
  'doubleclick.net',
  'adservice.google.com',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'connect.facebook.net',
  'ads-twitter.com',
  'analytics.twitter.com',
  'adnxs.com',
  'adsrvr.org',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'amazon-adsystem.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'scorecardresearch.com',
  'quantserve.com',
  'demdex.net',
  'hotjar.com',
  'mixpanel.com',
  'segment.io'
]);

// Pre-compiled regex for faster matching
const AD_PATTERN = /pagead|adserver|doubleclick|googlesyndication|adservice|ptracking|\/ads[\/\?]|adsbygoogle/i;

// Cache for URL decisions (LRU-like behavior)
const urlCache = new Map<string, boolean>();
const MAX_CACHE_SIZE = 1000;

/**
 * Extract hostname from URL (optimized)
 */
function getHostname(url: string): string {
  try {
    const start = url.indexOf('://') + 3;
    const end = url.indexOf('/', start);
    return end === -1 ? url.slice(start) : url.slice(start, end);
  } catch {
    return '';
  }
}

/**
 * Check if URL should be blocked (optimized with caching)
 */
function shouldBlock(url: string): boolean {
  // Check cache first
  const cached = urlCache.get(url);
  if (cached !== undefined) {
    return cached;
  }
  
  const hostname = getHostname(url);
  
  // Quick whitelist check
  for (const white of WHITELIST_SET) {
    if (hostname.includes(white)) {
      urlCache.set(url, false);
      return false;
    }
  }
  
  // Quick ad domain check
  for (const ad of AD_DOMAINS_SET) {
    if (hostname.includes(ad)) {
      if (urlCache.size > MAX_CACHE_SIZE) {
        urlCache.clear(); // Simple cache eviction
      }
      urlCache.set(url, true);
      return true;
    }
  }
  
  // Pattern check (only if not in domain lists)
  const shouldBlockResult = AD_PATTERN.test(url);
  
  if (urlCache.size > MAX_CACHE_SIZE) {
    urlCache.clear();
  }
  urlCache.set(url, shouldBlockResult);
  
  return shouldBlockResult;
}

/**
 * Initialize ad blocker for a session
 */
export function initAdBlocker(ses: Electron.Session): void {
  console.log('[AdBlocker] Initializing...');
  
  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const { url } = details;
    
    // Skip non-http(s) immediately
    if (!url.startsWith('http')) {
      callback({ cancel: false });
      return;
    }
    
    if (shouldBlock(url)) {
      totalBlocked++;
      sessionBlocked++;
      callback({ cancel: true });
      return;
    }
    
    callback({ cancel: false });
  });
  
  console.log('[AdBlocker] Ready');
}

/**
 * Set custom User-Agent
 */
export function setPrivacyUserAgent(ses: Electron.Session): void {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  ses.setUserAgent(userAgent);
}

/**
 * Get blocking statistics
 */
export function getBlockStats(): { total: number; session: number } {
  return { total: totalBlocked, session: sessionBlocked };
}

export default { initAdBlocker, setPrivacyUserAgent, getBlockStats };
