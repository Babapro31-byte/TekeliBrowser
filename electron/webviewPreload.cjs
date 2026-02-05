/**
 * TekeliBrowser Webview Preload v1.1
 * Advanced YouTube Ad Blocker with MutationObserver
 */

'use strict';

// ==================== ANTI-DETECTION ====================

// Hide webdriver property
try {
  Object.defineProperty(navigator, 'webdriver', { 
    get: () => false,
    configurable: true 
  });
} catch (e) {}

// Hide automation indicators
try {
  // Remove Electron/automation indicators from user agent if present
  if (navigator.userAgent.includes('Electron')) {
    Object.defineProperty(navigator, 'userAgent', {
      get: () => navigator.userAgent.replace(/Electron\/[\d.]+\s*/g, ''),
      configurable: true
    });
  }
} catch (e) {}

// ==================== YOUTUBE AD BLOCKER ====================

if (location.hostname.includes('youtube.com')) {
  
  // Prevent multiple injections
  if (window.__TEKELI_ADBLOCK_V2__) {
    return;
  }
  window.__TEKELI_ADBLOCK_V2__ = true;
  
  console.log('[TekeliBrowser] YouTube AdBlocker v1.1 initializing...');
  
  // ==================== CONFIGURATION ====================
  
  const CONFIG = {
    // Ad indicator selectors
    adIndicators: [
      '.ad-showing',
      '.ad-interrupting',
      '.ytp-ad-player-overlay-instream-info'
    ],
    
    // Skip button selectors (comprehensive list)
    skipButtons: [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button-container button',
      'button.ytp-ad-skip-button',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-skip-button-slot .ytp-ad-skip-button',
      '[class*="ytp-ad-skip"] button',
      '.videoAdUiSkipButton',
      '.ytp-ad-preview-container + button',
      'button[class*="skip"]'
    ],
    
    // DOM elements to remove
    adElements: [
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
      'ytd-mealbar-promo-renderer',
      'yt-mealbar-promo-renderer',
      // Feed ads
      'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)',
      'ytd-rich-section-renderer:has(ytd-ad-slot-renderer)',
      // Shorts ads
      'ytd-reel-player-overlay-renderer[is-ad]'
    ],
    
    // Timing
    checkInterval: 100,
    observerDebounce: 50
  };
  
  // ==================== STATISTICS ====================
  
  const stats = {
    adsSkipped: 0,
    elementsRemoved: 0,
    skipButtonsClicked: 0
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const debounce = (fn, ms) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  };
  
  // ==================== CSS INJECTION ====================
  
  const injectAdBlockStyles = () => {
    const styleId = 'tekeli-adblock-css';
    if (document.getElementById(styleId)) return;
    
    const css = `
      /* === TekeliBrowser Ad Blocker CSS v1.1 === */
      
      /* Hide video player ads */
      .ytp-ad-module,
      .ytp-ad-overlay-container,
      .ytp-ad-text-overlay,
      .ytp-ad-overlay-slot,
      .video-ads,
      .ytp-ad-progress,
      .ytp-ad-progress-list,
      .ytp-ad-player-overlay,
      .ytp-ad-player-overlay-layout,
      .ytp-ad-action-interstitial,
      .ytp-ad-image-overlay,
      .ytp-ad-preview-container,
      .ytp-ad-preview-text,
      .ytp-ad-simple-ad-badge,
      .ytp-ad-duration-remaining,
      .ytp-ad-skip-ad-slot,
      .ytp-ad-feedback-dialog-renderer,
      .ytp-ad-survey-renderer {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
      
      /* Hide page ads */
      #player-ads,
      #masthead-ad,
      ytd-ad-slot-renderer,
      ytd-banner-promo-renderer,
      ytd-statement-banner-renderer,
      ytd-in-feed-ad-layout-renderer,
      ytd-display-ad-renderer,
      ytd-promoted-sparkles-web-renderer,
      ytd-promoted-video-renderer,
      ytd-compact-promoted-video-renderer,
      ytd-video-masthead-ad-v3-renderer,
      ytd-primetime-promo-renderer,
      .ytd-mealbar-promo-renderer,
      ytd-mealbar-promo-renderer,
      yt-mealbar-promo-renderer {
        display: none !important;
      }
      
      /* Hide feed ads */
      ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
      ytd-rich-section-renderer:has(ytd-ad-slot-renderer),
      ytd-item-section-renderer:has(ytd-ad-slot-renderer) {
        display: none !important;
      }
      
      /* Hide premium/membership promos */
      tp-yt-paper-dialog:has([dialog-title*="Premium"]),
      tp-yt-paper-dialog:has([dialog-title*="YouTube TV"]),
      ytd-popup-container:has(ytd-survey-renderer),
      yt-tooltip-renderer:has([aria-label*="Premium"]) {
        display: none !important;
      }
      
      /* Hide shorts ads */
      ytd-reel-player-overlay-renderer[is-ad],
      ytd-reel-video-renderer[is-ad="true"] {
        display: none !important;
      }
      
      /* Fix player layout when hiding ad elements */
      .html5-video-player.ad-showing .html5-video-container,
      .html5-video-player.ad-interrupting .html5-video-container {
        z-index: 1 !important;
      }
      
      /* Ensure video fills space when ad UI hidden */
      .html5-video-player.ad-showing video,
      .html5-video-player.ad-interrupting video {
        visibility: visible !important;
      }
    `;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    
    const target = document.head || document.documentElement;
    target.insertBefore(style, target.firstChild);
  };
  
  // ==================== AD DETECTION ====================
  
  const getPlayer = () => document.querySelector('.html5-video-player');
  const getVideo = () => document.querySelector('video');
  
  const isAdPlaying = () => {
    const player = getPlayer();
    if (!player) return false;
    
    // Check class-based indicators
    if (player.classList.contains('ad-showing') ||
        player.classList.contains('ad-interrupting') ||
        player.className.includes('ad-showing') ||
        player.className.includes('ad-interrupting')) {
      return true;
    }
    
    // Check for ad info overlay
    if (document.querySelector('.ytp-ad-player-overlay-instream-info')) {
      return true;
    }
    
    // Check for ad progress bar
    if (document.querySelector('.ytp-ad-progress-list')) {
      return true;
    }
    
    return false;
  };
  
  // ==================== AD SKIP FUNCTIONS ====================
  
  const clickSkipButton = () => {
    for (const selector of CONFIG.skipButtons) {
      try {
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
          if (button && button.offsetParent !== null && !button.disabled) {
            button.click();
            stats.skipButtonsClicked++;
            return true;
          }
        }
      } catch (e) {}
    }
    return false;
  };
  
  const skipToEnd = () => {
    const video = getVideo();
    if (!video || !isAdPlaying()) return false;
    
    try {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        // Skip to last second
        video.currentTime = video.duration - 0.1;
        stats.adsSkipped++;
        return true;
      }
    } catch (e) {}
    
    return false;
  };
  
  const speedUpAd = () => {
    const video = getVideo();
    if (!video || !isAdPlaying()) return;
    
    try {
      // Speed up to maximum
      if (video.playbackRate !== 16) {
        video.playbackRate = 16;
        video.muted = true;
      }
    } catch (e) {}
  };
  
  const resetVideoState = () => {
    const video = getVideo();
    if (!video || isAdPlaying()) return;
    
    try {
      if (video.playbackRate > 2) {
        video.playbackRate = 1;
      }
    } catch (e) {}
  };
  
  // ==================== DOM CLEANUP ====================
  
  const removeAdElements = () => {
    let removed = 0;
    
    for (const selector of CONFIG.adElements) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.parentNode) {
            el.remove();
            removed++;
          }
        });
      } catch (e) {}
    }
    
    if (removed > 0) {
      stats.elementsRemoved += removed;
    }
  };
  
  // ==================== MAIN AD HANDLER ====================
  
  let consecutiveAdFrames = 0;
  
  const handleAd = () => {
    if (!isAdPlaying()) {
      consecutiveAdFrames = 0;
      resetVideoState();
      return;
    }
    
    consecutiveAdFrames++;
    
    // Step 1: Try skip button (fastest method)
    if (clickSkipButton()) {
      consecutiveAdFrames = 0;
      return;
    }
    
    // Step 2: Try skipping to end
    if (consecutiveAdFrames > 2) {
      if (skipToEnd()) {
        consecutiveAdFrames = 0;
        return;
      }
    }
    
    // Step 3: Speed up as fallback
    if (consecutiveAdFrames > 5) {
      speedUpAd();
    }
  };
  
  // ==================== MUTATION OBSERVER ====================
  
  let observer = null;
  
  const setupMutationObserver = () => {
    if (observer) return;
    
    const debouncedHandler = debounce(() => {
      handleAd();
      removeAdElements();
    }, CONFIG.observerDebounce);
    
    observer = new MutationObserver((mutations) => {
      // Check if mutation is potentially ad-related
      let isRelevant = false;
      
      for (const mutation of mutations) {
        // Check target element
        const target = mutation.target;
        if (target.nodeType === 1) {
          const className = target.className || '';
          const id = target.id || '';
          
          if (className.includes('ad') ||
              className.includes('promo') ||
              className.includes('ytp-') ||
              id.includes('ad') ||
              id.includes('player')) {
            isRelevant = true;
            break;
          }
        }
        
        // Check added nodes
        if (mutation.addedNodes.length > 0) {
          isRelevant = true;
          break;
        }
        
        // Check for class changes
        if (mutation.attributeName === 'class') {
          isRelevant = true;
          break;
        }
      }
      
      if (isRelevant) {
        debouncedHandler();
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'src', 'hidden']
    });
  };
  
  // ==================== VIDEO EVENT LISTENERS ====================
  
  const setupVideoListeners = () => {
    const attachListeners = (video) => {
      if (!video || video.__tekeli_attached__) return;
      video.__tekeli_attached__ = true;
      
      // Check on time updates
      video.addEventListener('timeupdate', () => {
        if (isAdPlaying()) handleAd();
      }, { passive: true });
      
      // Check on play
      video.addEventListener('play', () => {
        if (isAdPlaying()) handleAd();
      }, { passive: true });
      
      // Check on load
      video.addEventListener('loadeddata', () => {
        setTimeout(() => {
          if (isAdPlaying()) handleAd();
        }, 100);
      }, { passive: true });
      
      // Check on source change
      video.addEventListener('loadstart', () => {
        if (isAdPlaying()) handleAd();
      }, { passive: true });
    };
    
    // Attach to existing video
    const video = getVideo();
    if (video) attachListeners(video);
    
    // Watch for new video elements
    const videoObserver = new MutationObserver(() => {
      const video = getVideo();
      if (video) attachListeners(video);
    });
    
    videoObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  };
  
  // ==================== PERIODIC CHECK ====================
  
  let checkInterval = null;
  
  const startPeriodicCheck = () => {
    if (checkInterval) return;
    
    checkInterval = setInterval(() => {
      handleAd();
    }, CONFIG.checkInterval);
  };
  
  // ==================== SPA NAVIGATION HANDLER ====================
  
  const handleNavigation = () => {
    // Re-inject styles
    injectAdBlockStyles();
    
    // Clean up ads after navigation
    setTimeout(() => {
      removeAdElements();
      handleAd();
    }, 200);
  };
  
  // ==================== INITIALIZATION ====================
  
  const init = () => {
    // Inject CSS immediately
    injectAdBlockStyles();
    
    // Initial cleanup
    removeAdElements();
    
    // Handle any playing ad
    handleAd();
    
    // Setup watchers
    setupMutationObserver();
    setupVideoListeners();
    startPeriodicCheck();
    
    // Handle YouTube SPA navigation
    window.addEventListener('yt-navigate-finish', handleNavigation);
    window.addEventListener('yt-page-data-updated', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    
    console.log('[TekeliBrowser] YouTube AdBlocker v1.1 ready');
  };
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run on full page load
  window.addEventListener('load', () => {
    injectAdBlockStyles();
    removeAdElements();
    handleAd();
  });
  
  // Expose stats for debugging (optional)
  window.__TEKELI_STATS__ = () => ({ ...stats });
}
