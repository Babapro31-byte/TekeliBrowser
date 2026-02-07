/**
 * TekeliBrowser Professional Ad Blocker Engine v1.1
 * Enhanced with YouTube-specific blocking and FilterManager integration
 */

import { session } from 'electron';
import { filterManager, FilterConfig } from './filterManager.js';

// Ad blocking statistics
let totalBlocked = 0;
let sessionBlocked = 0;
let youtubeAdsBlocked = 0;

// Statistics by category
const blockStats = {
  network: 0,
  youtube: 0,
  tracking: 0
};

// Pre-compiled Sets for O(1) lookup (much faster than array.includes)
const WHITELIST_SET = new Set([
  'googlevideo.com',      // YouTube video content (not ads)
  'ytimg.com',            // YouTube thumbnails
  'ggpht.com',            // Google profile photos
  'gstatic.com',          // Google static content
  'googleapis.com',       // Google APIs
  'accounts.google.com',  // Google login
  'play.google.com',      // Google Play
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'jsdelivr.net',
  'cloudflare.com',
  'akamaized.net',
  'fastly.net',
  'youtube.com/watch',     // Main video pages
  'youtube.com/results',   // Search results
  'youtube.com/channel',   // Channel pages
  'youtube.com/playlist',  // Playlists
  'youtube.com/@',         // User channels
  'youtube.com/feed',      // Feed pages
  'youtube.com/shorts'     // Shorts (video content)
]);

const AD_DOMAINS_SET = new Set([
  // Google Ads
  'googlesyndication.com',
  'googleadservices.com',
  'doubleclick.net',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'www.googleadservices.com',
  // Analytics & Tracking
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  // Social Media Ads
  'facebook.net',
  'connect.facebook.net',
  'ads-twitter.com',
  'analytics.twitter.com',
  // Ad Networks
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
  'moatads.com',
  'serving-sys.com',
  // Tracking
  'scorecardresearch.com',
  'quantserve.com',
  'demdex.net',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'newrelic.com',
  'nr-data.net'
]);

// EasyPrivacy-style tracker domains (additional to AD_DOMAINS_SET)
const TRACKER_DOMAINS_SET = new Set([
  'facebook.com/tr',
  'connect.facebook.net',
  'www.facebook.com/tr',
  'pixel.facebook.com',
  'analytics.facebook.com',
  'google-analytics.com',
  'www.google-analytics.com',
  'ssl.google-analytics.com',
  'googletagmanager.com',
  'www.googletagmanager.com',
  'tagmanager.google.com',
  'doubleclick.net',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'googleadservices.com',
  'amazon-adsystem.com',
  'bat.bing.com',
  'snap.licdn.com',
  'px.ads.linkedin.com',
  'analytics.tiktok.com',
  'pixel.tiktok.com',
  'hotjar.com',
  'script.hotjar.com',
  'mixpanel.com',
  'api.mixpanel.com',
  'segment.io',
  'cdn.segment.com',
  'api.segment.io',
  'fullstory.com',
  'rs.fullstory.com',
  'clarity.ms',
  'www.clarity.ms',
  'mouseflow.com',
  'luckyorange.com',
  'crazyegg.com',
  'sessioncam.com',
  'inspectlet.com',
  'sumome.com',
  'sharethis.com',
  'addthis.com',
  'gravatar.com/avatar',  // tracking via gravatar
  'sentry.io',
  'bugsnag.com',
  'logrocket.com',
  'amplitude.com',
  'heapanalytics.com',
  'intercom.io',
  'drift.com',
  'hubspot.com',
  'hs-analytics.net',
  'hs-scripts.com',
  'pardot.com',
  'marketo.com',
  'quantserve.com',
  'scorecardresearch.com',
  'demdex.net',
  'everesttech.net',
  'exelator.com',
  'bluekai.com',
  'krxd.net',
  'rlcdn.com',
  'adsrvr.org',
  'casalemedia.com',
  'lijit.com',
  'connextra.com',
  'tribalfusion.com',
  'media.net',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'mgid.com',
  'revcontent.com',
  'zemanta.com',
  'gumgum.com',
  'teads.tv',
  'spotxchange.com',
  'freewheel.tv',
  'springserve.com',
  'yieldmo.com',
  'triplelift.com',
  'sharethrough.com',
  'undertone.com',
  'conversantmedia.com',
  'advertising.com',
  'adroll.com',
  'retargeter.com',
  'perfect-audience.com',
  'adnxs.com',
  'adsymptotic.com',
  'bidswitch.net',
  'mathtag.com',
  'mediamath.com',
  'turn.com',
  'liveramp.com',
  'lotame.com',
  'digiTrust.com',
  'idx.com',
  'bidtheatre.com',
  'adform.net',
  'smartadserver.com',
  'sovrn.com',
  'openx.net',
  'rubiconproject.com',
  'pubmatic.com',
  'contextweb.com',
  'lijit.com',
  'appnexus.com',
  '2mdn.net',
  'googlesyndication.com',
  'google.com/pagead',
  'tpc.googlesyndication.com',
  'pagead2.googlesyndication.com'
]);

// Tracking query parameters to strip from URLs
const TRACKING_PARAMS = [
  'fbclid',           // Facebook click ID
  'gclid',            // Google click ID
  'gclsrc',           // Google click source
  'dclid',            // DoubleClick click ID
  'wbraid',           // Google web-to-app
  'gbraid',           // Google app-to-web
  'msclkid',          // Microsoft/Bing click ID
  'mc_cid',           // Mailchimp campaign ID
  'mc_eid',           // Mailchimp email ID
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  '_ga',              // Google Analytics
  '_gl',              // Google link
  '_hsenc',
  '_hsmi',
  'ref',
  'ref_src',
  'ref_url',
  'referrer',
  'source',
  'campaign',
  'mkt_tok',
  'trk',
  'trkCampaign',
  'usqp',
  'oq',
  'ved',
  'ei',
  'gs_l',
  'gws_rd',
  'ijn',
  'srsltid',
  'os_ehash',
  '_kx',
  'vero_id',
  'hsa_acc',
  'hsa_cam',
  'hsa_grp',
  'hsa_ad',
  'hsa_src',
  'hsa_tgt',
  'hsa_kw',
  'hsa_mt',
  'hsa_net',
  'hsa_ver'
];

// Tracker blocking toggle (default enabled)
let trackerBlockingEnabled = true;

/**
 * Strip tracking query parameters from URL
 */
function stripTrackingParams(url: string): string | null {
  try {
    const u = new URL(url);
    let modified = false;
    for (const param of TRACKING_PARAMS) {
      if (u.searchParams.has(param)) {
        u.searchParams.delete(param);
        modified = true;
      }
    }
    // Also strip utm_* params (catch-all)
    const toDelete: string[] = [];
    u.searchParams.forEach((_, key) => {
      if (key.toLowerCase().startsWith('utm_')) toDelete.push(key);
    });
    toDelete.forEach(k => { u.searchParams.delete(k); modified = true; });
    return modified ? u.toString() : null;
  } catch {
    return null;
  }
}

// YouTube-specific ad patterns (URL paths and parameters)
const YOUTUBE_AD_PATTERNS = [
  // Ad serving endpoints
  '/pagead/',
  '/ptracking',
  '/api/stats/ads',
  '/api/stats/atr',
  '/api/stats/qoe?.*adformat',
  '/get_midroll_',
  '/youtubei/v1/player/ad_break',
  // Ad-related parameters in URLs
  'googlevideo.com/videoplayback.*&oad=',
  'googlevideo.com/videoplayback.*&ctier=L',
  'googlevideo.com/videoplayback.*itag=59[0-9]',  // Ad video streams
  '&ad_type=',
  '&adformat=',
  '&advid=',
  // Tracking pixels
  '/pcs/activeview',
  '/pagead/viewthroughconversion',
  '/pagead/conversion',
  '/pagead/lvz',
  '/error_204.*&ad',
  's.youtube.com/api/stats/watchtime.*&ad',
  's.youtube.com/api/stats/delayplay.*&ad',
  // Doubleclick
  'ad.doubleclick.net',
  'static.doubleclick.net',
  'googleads.g.doubleclick.net',
  // Ad manifest/playlist
  'manifest.googlevideo.com/api/manifest/hls_variant/.*ad',
  'manifest.googlevideo.com/api/manifest/dash/.*ad'
];

// Pre-compiled regex patterns for faster matching
const AD_PATTERN = /pagead|adserver|doubleclick|googlesyndication|adservice|ptracking|\/ads[\/\?]|adsbygoogle/i;

// YouTube-specific compiled pattern
const YOUTUBE_AD_REGEX = new RegExp(
  YOUTUBE_AD_PATTERNS
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*'))
    .join('|'),
  'i'
);

// Dynamic patterns from FilterManager
let dynamicNetworkPatterns: RegExp | null = null;
let dynamicBlockedDomains: Set<string> = new Set();

// Cache for URL decisions (LRU-like behavior)
const urlCache = new Map<string, boolean>();
const MAX_CACHE_SIZE = 2000;

/**
 * Update dynamic patterns from FilterManager
 */
export function updateDynamicPatterns(): void {
  try {
    const patterns = filterManager.getNetworkPatterns();
    if (patterns.length > 0) {
      const patternStr = patterns
        .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*'))
        .join('|');
      dynamicNetworkPatterns = new RegExp(patternStr, 'i');
      console.log('[AdBlocker] Dynamic patterns updated:', patterns.length, 'patterns');
    }
    const domains = typeof (filterManager as any).getBlockedDomains === 'function'
      ? (filterManager as any).getBlockedDomains()
      : [];
    dynamicBlockedDomains = new Set(Array.isArray(domains) ? domains : []);
  } catch (error) {
    console.error('[AdBlocker] Failed to update dynamic patterns:', error);
  }
}

function isBlockedByHosts(hostname: string): boolean {
  if (dynamicBlockedDomains.size === 0) return false;
  let host = hostname.toLowerCase();
  if (host.includes(':')) host = host.split(':')[0];
  while (host) {
    if (dynamicBlockedDomains.has(host)) return true;
    const dot = host.indexOf('.');
    if (dot === -1) return false;
    host = host.slice(dot + 1);
  }
  return false;
}

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
 * Check if hostname/URL matches known tracker domain
 */
function isTrackerDomain(url: string): boolean {
  const hostname = getHostname(url);
  for (const tracker of TRACKER_DOMAINS_SET) {
    if (hostname.includes(tracker) || url.includes(tracker)) return true;
  }
  return false;
}

/**
 * Check if this is a YouTube video content URL (should NOT be blocked)
 */
function isYouTubeVideoContent(url: string): boolean {
  // Allow actual video content
  if (url.includes('googlevideo.com/videoplayback')) {
    // Block if it has ad indicators in the URL
    if (url.includes('&oad=') || 
        url.includes('&ctier=L') ||
        url.includes('&ad_type=') ||
        /itag=59\d/.test(url)) {
      return false; // This is an ad stream
    }
    return true; // This is regular video content
  }
  return false;
}

/**
 * Check if URL is a YouTube ad-related request
 */
function isYouTubeAdRequest(url: string): boolean {
  // Quick checks for common YouTube ad endpoints
  if (url.includes('/pagead/') ||
      url.includes('/ptracking') ||
      url.includes('/api/stats/ads') ||
      url.includes('/get_midroll_') ||
      url.includes('/api/stats/atr') ||
      url.includes('/pcs/activeview')) {
    return true;
  }
  
  // Check YouTube-specific ad pattern
  if (YOUTUBE_AD_REGEX.test(url)) {
    return true;
  }
  
  return false;
}

/**
 * Check if URL should be blocked (optimized with caching)
 */
function shouldBlock(url: string): { block: boolean; category: 'youtube' | 'network' | 'tracking' | 'none' } {
  // Check cache first
  const cached = urlCache.get(url);
  if (cached !== undefined) {
    return { block: cached, category: cached ? 'network' : 'none' };
  }
  
  const hostname = getHostname(url);
  const isYouTube = hostname.includes('youtube.com') || hostname.includes('googlevideo.com');
  
  // For YouTube domains, use specialized logic
  if (isYouTube) {
    // Allow actual video content
    if (isYouTubeVideoContent(url)) {
      cacheResult(url, false);
      return { block: false, category: 'none' };
    }
    
    // Check YouTube ad patterns
    if (isYouTubeAdRequest(url)) {
      cacheResult(url, true);
      return { block: true, category: 'youtube' };
    }
  }
  
  // Quick whitelist check
  for (const white of WHITELIST_SET) {
    if (hostname.includes(white) || url.includes(white)) {
      cacheResult(url, false);
      return { block: false, category: 'none' };
    }
  }
  
  // Quick ad domain check
  for (const ad of AD_DOMAINS_SET) {
    if (hostname.includes(ad)) {
      cacheResult(url, true);
      return { block: true, category: 'network' };
    }
  }

  if (isBlockedByHosts(hostname)) {
    cacheResult(url, true);
    return { block: true, category: 'network' };
  }
  
  // General ad pattern check
  if (AD_PATTERN.test(url)) {
    cacheResult(url, true);
    return { block: true, category: 'tracking' };
  }
  
  // Dynamic patterns from FilterManager
  if (dynamicNetworkPatterns && dynamicNetworkPatterns.test(url)) {
    cacheResult(url, true);
    return { block: true, category: 'network' };
  }
  
  cacheResult(url, false);
  return { block: false, category: 'none' };
}

/**
 * Cache URL blocking decision
 */
function cacheResult(url: string, shouldBlock: boolean): void {
  if (urlCache.size > MAX_CACHE_SIZE) {
    // Clear oldest entries (simple eviction)
    const keysToDelete = Array.from(urlCache.keys()).slice(0, MAX_CACHE_SIZE / 2);
    keysToDelete.forEach(key => urlCache.delete(key));
  }
  urlCache.set(url, shouldBlock);
}

/**
 * Initialize ad blocker for a session
 */
export async function initAdBlocker(ses: Electron.Session): Promise<void> {
  console.log('[AdBlocker] Initializing v1.1...');
  
  // Initialize FilterManager
  await filterManager.initialize();
  
  // Update dynamic patterns from FilterManager
  updateDynamicPatterns();
  
  // Set up request interception
  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    let { url } = details;
    
    // Skip non-http(s) immediately
    if (!url.startsWith('http')) {
      callback({ cancel: false });
      return;
    }

    // Tracker blocking: strip tracking params (mainFrame navigations only)
    if (trackerBlockingEnabled && details.resourceType === 'mainFrame') {
      const stripped = stripTrackingParams(url);
      if (stripped && stripped !== url) {
        callback({ redirectURL: stripped });
        return;
      }
    }

    // Tracker blocking: block known tracker domains
    if (trackerBlockingEnabled && isTrackerDomain(url)) {
      totalBlocked++;
      sessionBlocked++;
      blockStats.tracking++;
      callback({ cancel: true });
      return;
    }
    
    const result = shouldBlock(url);
    
    if (result.block) {
      totalBlocked++;
      sessionBlocked++;
      blockStats[result.category === 'none' ? 'network' : result.category]++;
      
      if (result.category === 'youtube') {
        youtubeAdsBlocked++;
      }
      
      callback({ cancel: true });
      return;
    }
    
    callback({ cancel: false });
  });
  
  // Set up response header modification to remove tracking headers
  ses.webRequest.onHeadersReceived({ urls: ['<all_urls>'] }, (details, callback) => {
    const headers = { ...details.responseHeaders };
    
    // Remove tracking-related headers
    delete headers['set-cookie'];  // Optional: uncomment to block cookies
    
    callback({ responseHeaders: headers });
  });
  
  // Periodically check for filter updates
  setInterval(async () => {
    const [updated, updatedLists] = await Promise.all([
      filterManager.checkForUpdates(),
      (filterManager as any).checkForListUpdates?.() ?? false
    ]);
    if (updated || updatedLists) {
      updateDynamicPatterns();
      urlCache.clear(); // Clear cache when patterns change
      console.log('[AdBlocker] Filters updated to v' + filterManager.getVersion());
    }
  }, 60 * 60 * 1000); // Check every hour
  
  console.log('[AdBlocker] Ready - Filter version:', filterManager.getVersion());
}

/**
 * Set custom User-Agent for privacy
 */
export function setPrivacyUserAgent(ses: Electron.Session): void {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  ses.setUserAgent(userAgent);
}

/**
 * Get blocking statistics
 */
export function getBlockStats(): { 
  total: number; 
  session: number; 
  youtube: number;
  byCategory: typeof blockStats;
  filterVersion: string;
} {
  return { 
    total: totalBlocked, 
    session: sessionBlocked,
    youtube: youtubeAdsBlocked,
    byCategory: { ...blockStats },
    filterVersion: filterManager.getVersion()
  };
}

/**
 * Force update filters
 */
export async function forceUpdateFilters(): Promise<{ success: boolean; version: string }> {
  const result = await filterManager.forceUpdate();
  if (result.success) {
    updateDynamicPatterns();
    urlCache.clear();
  }
  return result;
}

/**
 * Get filter manager instance for advanced usage
 */
export function getFilterManager(): any {
  return filterManager;
}

/**
 * Clear URL cache (useful after filter updates)
 */
export function clearCache(): void {
  urlCache.clear();
  console.log('[AdBlocker] Cache cleared');
}

/**
 * Enable/disable tracker blocking (EasyPrivacy-style domains + URL param stripping)
 */
export function setTrackerBlocking(enabled: boolean): void {
  trackerBlockingEnabled = enabled;
  console.log('[AdBlocker] Tracker blocking:', enabled ? 'enabled' : 'disabled');
}

/**
 * Get tracker blocking state
 */
export function isTrackerBlockingEnabled(): boolean {
  return trackerBlockingEnabled;
}

export default { 
  initAdBlocker, 
  setPrivacyUserAgent, 
  getBlockStats, 
  forceUpdateFilters,
  getFilterManager,
  clearCache,
  setTrackerBlocking,
  isTrackerBlockingEnabled
};
