/**
 * TekeliBrowser Webview Preload - Optimized
 */

// Hide webdriver (run once)
try {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
} catch (e) {}

// YouTube Ad Skipper (only on YouTube)
if (location.hostname.includes('youtube.com')) {
  let interval = null;
  
  const skipAd = () => {
    // Check for ad
    const player = document.querySelector('.html5-video-player');
    if (!player || !player.classList.contains('ad-showing')) return;
    
    // Try skip button
    const skip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skip) {
      skip.click();
      return;
    }
    
    // Speed up ad
    const video = document.querySelector('video');
    if (video && video.playbackRate < 16) {
      video.playbackRate = 16;
      video.muted = true;
    }
  };
  
  // Start when ready
  const start = () => {
    if (!interval) {
      interval = setInterval(skipAd, 1000);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}
