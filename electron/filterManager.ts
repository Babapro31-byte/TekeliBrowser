/**
 * TekeliBrowser Filter Manager
 * Remote filter downloading, caching, and update management
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Filter configuration interface
export interface FilterConfig {
  version: string;
  lastUpdated: string;
  networkPatterns: string[];
  domSelectors: string[];
  videoAdIndicators: string[];
  skipButtonSelectors: string[];
  adContainerSelectors: string[];
}

// Default built-in filters (fallback)
const DEFAULT_FILTERS: FilterConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  networkPatterns: [
    // YouTube ad-related patterns
    '/pagead/',
    '/ptracking/',
    '/api/stats/ads',
    '/api/stats/qoe?ads',
    '/get_video_info?.*?ad_',
    'googlevideo.com/videoplayback.*?oad=',
    'youtube.com/api/stats/atr',
    'youtube.com/pagead/',
    'youtube.com/ptracking',
    'youtube.com/get_midroll_',
    'doubleclick.net',
    'googleadservices.com',
    'googlesyndication.com',
    'youtube.com/error_204.*?ad',
    's.youtube.com/api/stats/watchtime.*?ad',
    'www.youtube.com/pcs/activeview',
    // General tracking
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.net',
    'scorecardresearch.com'
  ],
  domSelectors: [
    // Video player ads
    '.ytp-ad-module',
    '.ytp-ad-overlay-container',
    '.ytp-ad-text-overlay',
    '.ytp-ad-overlay-slot',
    '.ytp-ad-progress',
    '.ytp-ad-progress-list',
    '.ytp-ad-player-overlay',
    '.ytp-ad-player-overlay-layout',
    '.ytp-ad-action-interstitial',
    '.ytp-ad-action-interstitial-background',
    '.ytp-ad-image-overlay',
    // Page ads
    '#player-ads',
    '#masthead-ad',
    'ytd-ad-slot-renderer',
    'ytd-banner-promo-renderer',
    'ytd-statement-banner-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    'ytd-compact-promoted-video-renderer',
    'ytd-video-masthead-ad-v3-renderer',
    'ytd-primetime-promo-renderer',
    '.ytd-mealbar-promo-renderer',
    '.ytd-carousel-ad-renderer',
    // Shorts ads
    'ytd-reel-player-overlay-renderer[is-ad]',
    // Feed ads
    'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)',
    // Membership promos
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    // Survey popups
    '.ytd-popup-container:has(ytd-survey-renderer)',
    // Premium popups
    'ytd-mealbar-promo-renderer',
    'yt-mealbar-promo-renderer',
    'tp-yt-paper-dialog:has([dialog-title*="Premium"])',
    'tp-yt-paper-dialog:has([dialog-title*="YouTube TV"])'
  ],
  videoAdIndicators: [
    '.ad-showing',
    '.ad-interrupting',
    '[class*="ad-showing"]',
    '.ytp-ad-player-overlay-instream-info'
  ],
  skipButtonSelectors: [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-container button',
    'button.ytp-ad-skip-button',
    'button.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button-slot button',
    '.ytp-ad-skip-button-slot .ytp-ad-skip-button',
    '[class*="skip"] button',
    '.videoAdUiSkipButton',
    '.ytp-ad-preview-container + button'
  ],
  adContainerSelectors: [
    '.video-ads',
    '.ytp-ad-module',
    '#movie_player.ad-showing .video-ads',
    '.ytp-ad-player-overlay-layout'
  ]
};

// Remote filter URL (can be changed to your own server)
const FILTER_URL = 'https://raw.githubusercontent.com/AriaMahdrani/tekeli-browser-filters/main/youtube-filters.json';
const CACHE_FILENAME = 'youtube-filters-cache.json';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

class FilterManager {
  private filters: FilterConfig = DEFAULT_FILTERS;
  private cacheDir: string = '';
  private cachePath: string = '';
  private lastUpdateCheck: number = 0;
  private isInitialized: boolean = false;

  /**
   * Initialize the filter manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set up cache directory
      this.cacheDir = path.join(app.getPath('userData'), 'filters');
      this.cachePath = path.join(this.cacheDir, CACHE_FILENAME);

      // Create cache directory if it doesn't exist
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      // Try to load cached filters
      await this.loadCachedFilters();

      // Check for updates in background
      this.checkForUpdates().catch(err => {
        console.log('[FilterManager] Background update check failed:', err.message);
      });

      this.isInitialized = true;
      console.log('[FilterManager] Initialized with filter version:', this.filters.version);
    } catch (error) {
      console.error('[FilterManager] Initialization error:', error);
      // Use default filters on error
      this.filters = DEFAULT_FILTERS;
      this.isInitialized = true;
    }
  }

  /**
   * Load filters from local cache
   */
  private async loadCachedFilters(): Promise<void> {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = fs.readFileSync(this.cachePath, 'utf-8');
        const cached = JSON.parse(data);
        
        if (this.validateFilters(cached.filters)) {
          this.filters = cached.filters;
          this.lastUpdateCheck = cached.lastCheck || 0;
          console.log('[FilterManager] Loaded cached filters v' + this.filters.version);
        }
      }
    } catch (error) {
      console.log('[FilterManager] No valid cache found, using defaults');
    }
  }

  /**
   * Save filters to local cache
   */
  private async saveCachedFilters(): Promise<void> {
    try {
      const cacheData = {
        filters: this.filters,
        lastCheck: Date.now()
      };
      fs.writeFileSync(this.cachePath, JSON.stringify(cacheData, null, 2));
      console.log('[FilterManager] Filters cached successfully');
    } catch (error) {
      console.error('[FilterManager] Failed to cache filters:', error);
    }
  }

  /**
   * Validate filter configuration
   */
  private validateFilters(config: any): config is FilterConfig {
    return (
      config &&
      typeof config.version === 'string' &&
      Array.isArray(config.networkPatterns) &&
      Array.isArray(config.domSelectors) &&
      Array.isArray(config.videoAdIndicators) &&
      Array.isArray(config.skipButtonSelectors)
    );
  }

  /**
   * Check for filter updates from remote server
   */
  async checkForUpdates(force: boolean = false): Promise<boolean> {
    const now = Date.now();
    
    // Skip if checked recently (unless forced)
    if (!force && (now - this.lastUpdateCheck) < UPDATE_INTERVAL) {
      return false;
    }

    try {
      console.log('[FilterManager] Checking for filter updates...');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(FILTER_URL, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const remoteFilters = await response.json();
      
      if (this.validateFilters(remoteFilters)) {
        // Check if newer version
        if (remoteFilters.version !== this.filters.version) {
          console.log('[FilterManager] New filters found: v' + remoteFilters.version);
          this.filters = remoteFilters;
          await this.saveCachedFilters();
          return true;
        } else {
          console.log('[FilterManager] Filters are up to date');
        }
      }

      this.lastUpdateCheck = now;
      return false;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[FilterManager] Update check timed out');
      } else {
        console.log('[FilterManager] Update check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Force update filters from remote
   */
  async forceUpdate(): Promise<{ success: boolean; version: string }> {
    const updated = await this.checkForUpdates(true);
    return {
      success: updated,
      version: this.filters.version
    };
  }

  /**
   * Get current filters
   */
  getFilters(): FilterConfig {
    return { ...this.filters };
  }

  /**
   * Get network blocking patterns
   */
  getNetworkPatterns(): string[] {
    return [...this.filters.networkPatterns];
  }

  /**
   * Get DOM selectors for ad elements
   */
  getDomSelectors(): string[] {
    return [...this.filters.domSelectors];
  }

  /**
   * Get video ad indicator selectors
   */
  getVideoAdIndicators(): string[] {
    return [...this.filters.videoAdIndicators];
  }

  /**
   * Get skip button selectors
   */
  getSkipButtonSelectors(): string[] {
    return [...this.filters.skipButtonSelectors];
  }

  /**
   * Get ad container selectors
   */
  getAdContainerSelectors(): string[] {
    return [...this.filters.adContainerSelectors];
  }

  /**
   * Get filter version
   */
  getVersion(): string {
    return this.filters.version;
  }

  /**
   * Get filter stats
   */
  getStats(): { version: string; lastUpdated: string; patternCount: number } {
    return {
      version: this.filters.version,
      lastUpdated: this.filters.lastUpdated,
      patternCount: 
        this.filters.networkPatterns.length + 
        this.filters.domSelectors.length +
        this.filters.videoAdIndicators.length +
        this.filters.skipButtonSelectors.length
    };
  }
}

// Singleton instance
export const filterManager = new FilterManager();
export default filterManager;
