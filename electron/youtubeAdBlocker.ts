/**
 * TekeliBrowser YouTube Ad Blocker
 * DOM manipulation and CSS injection for YouTube ad blocking
 * This module generates the content script to be injected into webviews
 */

import { FilterConfig } from './filterManager.js';

/**
 * Generate the YouTube ad blocker script to inject into webview
 * This creates a self-contained script that runs in the page context
 */
export function generateYouTubeAdBlockerScript(filters: FilterConfig): string {
  return `
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.__TEKELI_YT_ADBLOCKER__) return;
  window.__TEKELI_YT_ADBLOCKER__ = true;
  
  // Only run on YouTube
  if (!location.hostname.includes('youtube.com')) return;
  
  console.log('[TekeliBrowser] YouTube AdBlocker v${filters.version} initialized');
  
  // ==================== CONFIGURATION ====================
  
  const CONFIG = {
    domSelectors: ${JSON.stringify(filters.domSelectors)},
    videoAdIndicators: ${JSON.stringify(filters.videoAdIndicators)},
    skipButtonSelectors: ${JSON.stringify(filters.skipButtonSelectors)},
    adContainerSelectors: ${JSON.stringify(filters.adContainerSelectors)},
    checkInterval: 100,      // How often to check for ads (ms)
    observerDebounce: 50,    // Debounce for MutationObserver
    maxSkipAttempts: 10,     // Max attempts to click skip button
    debug: false             // Set to true for verbose logging
  };
  
  // ==================== STATISTICS ====================
  
  const stats = {
    adsSkipped: 0,
    elementsRemoved: 0,
    overlaysHidden: 0
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const log = (msg, ...args) => {
    if (CONFIG.debug) console.log('[TekeliBrowser]', msg, ...args);
  };
  
  const debounce = (fn, ms) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  };
  
  // ==================== CSS INJECTION ====================
  
  const injectStyles = () => {
    const styleId = 'tekeli-yt-adblock-styles';
    if (document.getElementById(styleId)) return;
    
    const css = \`
      /* Hide ad containers */
      \${CONFIG.domSelectors.join(',\\n      ')} {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }
      
      /* Hide ad overlays on video */
      .ytp-ad-overlay-container,
      .ytp-ad-text-overlay,
      .ytp-ad-overlay-slot,
      .video-ads {
        display: none !important;
        opacity: 0 !important;
      }
      
      /* Hide premium/membership promos */
      ytd-mealbar-promo-renderer,
      yt-mealbar-promo-renderer,
      tp-yt-paper-dialog.ytd-mealbar-promo-renderer {
        display: none !important;
      }
      
      /* Hide ad badges */
      .ytp-ad-preview-container,
      .ytp-ad-preview-text,
      .ytp-ad-simple-ad-badge,
      .ytp-ad-duration-remaining {
        display: none !important;
      }
      
      /* Remove space for hidden ads */
      ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
      ytd-rich-section-renderer:has(ytd-ad-slot-renderer),
      ytd-item-section-renderer:has(ytd-ad-slot-renderer) {
        display: none !important;
      }
      
      /* Fix player layout when ad UI is hidden */
      .html5-video-player.ad-showing .html5-video-container,
      .html5-video-player.ad-interrupting .html5-video-container {
        z-index: 1 !important;
      }
      
      /* Hide "Skip Ads" survey */
      .ytp-ad-skip-ad-slot,
      .ytp-ad-feedback-dialog-renderer {
        display: none !important;
      }
      
      /* Shorts ads */
      ytd-reel-video-renderer[is-ad="true"],
      ytd-reel-player-overlay-renderer[is-ad] {
        display: none !important;
      }
    \`;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    log('Styles injected');
  };
  
  // ==================== AD DETECTION ====================
  
  const isAdPlaying = () => {
    const player = document.querySelector('.html5-video-player');
    if (!player) return false;
    
    // Check class-based indicators
    for (const indicator of CONFIG.videoAdIndicators) {
      if (indicator.startsWith('.')) {
        if (player.classList.contains(indicator.slice(1))) return true;
      } else if (indicator.startsWith('[')) {
        if (player.matches(indicator)) return true;
      } else if (document.querySelector(indicator)) {
        return true;
      }
    }
    
    // Check for ad-showing class variations
    if (player.className.includes('ad-showing') || 
        player.className.includes('ad-interrupting')) {
      return true;
    }
    
    // Check for ad info overlay
    if (document.querySelector('.ytp-ad-player-overlay-instream-info')) {
      return true;
    }
    
    return false;
  };
  
  // ==================== SKIP AD FUNCTIONS ====================
  
  const clickSkipButton = () => {
    for (const selector of CONFIG.skipButtonSelectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button && button.offsetParent !== null) {
          try {
            button.click();
            log('Clicked skip button:', selector);
            stats.adsSkipped++;
            return true;
          } catch (e) {}
        }
      }
    }
    return false;
  };
  
  const skipAdByTime = () => {
    const video = document.querySelector('video');
    if (!video || !isAdPlaying()) return false;
    
    // Try to skip to end
    if (video.duration && isFinite(video.duration) && video.duration > 0) {
      video.currentTime = video.duration;
      log('Skipped ad by setting time to duration');
      stats.adsSkipped++;
      return true;
    }
    
    return false;
  };
  
  const speedUpAd = () => {
    const video = document.querySelector('video');
    if (!video || !isAdPlaying()) return;
    
    if (video.playbackRate < 16) {
      video.playbackRate = 16;
      video.muted = true;
      log('Ad sped up to 16x');
    }
  };
  
  const resetVideoState = () => {
    const video = document.querySelector('video');
    if (!video || isAdPlaying()) return;
    
    if (video.playbackRate > 1) {
      video.playbackRate = 1;
      video.muted = false;
    }
  };
  
  // ==================== DOM REMOVAL ====================
  
  const removeAdElements = () => {
    let removed = 0;
    
    for (const selector of CONFIG.domSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.parentNode) {
            el.remove();
            removed++;
          }
        });
      } catch (e) {
        // Some selectors might fail in older browsers
      }
    }
    
    if (removed > 0) {
      stats.elementsRemoved += removed;
      log('Removed', removed, 'ad elements');
    }
  };
  
  const hideAdOverlays = () => {
    const overlays = document.querySelectorAll(
      '.ytp-ad-overlay-container, .ytp-ad-text-overlay, .video-ads .ytp-ad-overlay-slot'
    );
    
    overlays.forEach(overlay => {
      if (overlay.style.display !== 'none') {
        overlay.style.display = 'none';
        stats.overlaysHidden++;
      }
    });
  };
  
  // ==================== MAIN AD HANDLER ====================
  
  let skipAttempts = 0;
  
  const handleAd = () => {
    if (!isAdPlaying()) {
      skipAttempts = 0;
      resetVideoState();
      return;
    }
    
    log('Ad detected, attempting to skip...');
    
    // Try skip button first
    if (clickSkipButton()) {
      skipAttempts = 0;
      return;
    }
    
    // Try skipping by time
    if (skipAttempts < CONFIG.maxSkipAttempts) {
      if (skipAdByTime()) {
        skipAttempts = 0;
        return;
      }
      skipAttempts++;
    }
    
    // Fallback: speed up ad
    speedUpAd();
    hideAdOverlays();
  };
  
  // ==================== MUTATION OBSERVER ====================
  
  const setupObserver = () => {
    const debouncedHandler = debounce(() => {
      handleAd();
      removeAdElements();
    }, CONFIG.observerDebounce);
    
    const observer = new MutationObserver((mutations) => {
      // Quick check if any mutation is ad-related
      const isAdRelated = mutations.some(m => {
        const target = m.target;
        if (target.nodeType !== 1) return false;
        
        const className = target.className || '';
        const id = target.id || '';
        
        return className.includes('ad') || 
               className.includes('promo') ||
               id.includes('ad') ||
               m.addedNodes.length > 0;
      });
      
      if (isAdRelated) {
        debouncedHandler();
      }
    });
    
    // Observe the entire document for changes
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'src']
    });
    
    log('MutationObserver setup complete');
    return observer;
  };
  
  // ==================== VIDEO EVENT LISTENERS ====================
  
  const setupVideoListeners = () => {
    // Handle video element
    const attachToVideo = (video) => {
      if (!video || video.__tekeli_attached__) return;
      video.__tekeli_attached__ = true;
      
      video.addEventListener('timeupdate', () => {
        if (isAdPlaying()) {
          handleAd();
        }
      });
      
      video.addEventListener('play', () => {
        if (isAdPlaying()) {
          handleAd();
        }
      });
      
      video.addEventListener('loadeddata', () => {
        if (isAdPlaying()) {
          handleAd();
        }
      });
      
      log('Video listeners attached');
    };
    
    // Attach to existing video
    const video = document.querySelector('video');
    if (video) attachToVideo(video);
    
    // Watch for new video elements
    const videoObserver = new MutationObserver(() => {
      const video = document.querySelector('video');
      if (video) attachToVideo(video);
    });
    
    videoObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  };
  
  // ==================== PERIODIC CHECK ====================
  
  const startPeriodicCheck = () => {
    setInterval(() => {
      handleAd();
      removeAdElements();
    }, CONFIG.checkInterval);
    
    log('Periodic check started (interval:', CONFIG.checkInterval, 'ms)');
  };
  
  // ==================== INITIALIZATION ====================
  
  const init = () => {
    log('Initializing YouTube AdBlocker...');
    
    // Inject CSS immediately
    injectStyles();
    
    // Remove existing ads
    removeAdElements();
    
    // Setup observers
    setupObserver();
    setupVideoListeners();
    
    // Start periodic checking
    startPeriodicCheck();
    
    // Handle ad on page load
    handleAd();
    
    // Re-inject styles on navigation (SPA)
    const navigationHandler = () => {
      setTimeout(() => {
        injectStyles();
        removeAdElements();
      }, 100);
    };
    
    window.addEventListener('yt-navigate-finish', navigationHandler);
    window.addEventListener('popstate', navigationHandler);
    
    console.log('[TekeliBrowser] YouTube AdBlocker ready');
  };
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run on full load for lazy content
  window.addEventListener('load', () => {
    removeAdElements();
    handleAd();
  });
  
})();
`;
}

/**
 * Generate minimal CSS-only ad blocker for quick injection
 */
export function generateQuickBlockerCSS(selectors: string[]): string {
  return `
${selectors.join(',\n')} {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
`;
}

export default { generateYouTubeAdBlockerScript, generateQuickBlockerCSS };
