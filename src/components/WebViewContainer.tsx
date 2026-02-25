import { useEffect, useRef, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tab } from '../App';
import NewTabPage from './NewTabPage';
import DownloadsPage from './DownloadsPage';
import type { ThemeDef, ThemeId } from '../utils/themes';

// Special internal URLs
const NEWTAB_URL = 'tekeli://newtab';
const DOWNLOADS_URL = 'tekeli://downloads';

interface WebViewContainerProps {
  tab: Tab;
  onTitleUpdate: (title: string) => void;
  onNavigate?: (url: string) => void;
  activeTheme?: ThemeDef;
  activeThemeId?: ThemeId;
}

// Skeleton Loading Screen
const SkeletonScreen = ({ activeTheme }: { activeTheme?: ThemeDef }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`absolute inset-0 z-10 p-8 flex flex-col gap-6 ${activeTheme ? activeTheme.window : 'bg-bg-primary'}`}
  >
    {/* Header Skeleton */}
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse-slow overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-6 w-1/3 rounded-lg bg-white/5 animate-pulse-slow overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-4 w-1/4 rounded-lg bg-white/5 animate-pulse-slow overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="flex-1 flex gap-6 mt-8">
      {/* Sidebar Skeleton */}
      <div className="w-64 flex flex-col gap-4 hidden md:flex">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 w-full rounded-lg bg-white/5 animate-pulse-slow overflow-hidden relative" style={{ opacity: 1 - i * 0.1 }}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ))}
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="w-full h-64 rounded-2xl bg-white/5 animate-pulse-slow overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-full h-48 rounded-2xl bg-white/5 animate-pulse-slow overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

// Memoized component to prevent unnecessary re-renders
const WebViewContainer = memo(({ tab, onTitleUpdate, onNavigate, activeTheme, activeThemeId }: WebViewContainerProps) => {
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const isReadyRef = useRef(false);
  const lastTitleRef = useRef('');
  const mediaPollIntervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(tab.isLoading ?? true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Check if this is the new tab page
  const isNewTabPage = tab.url === NEWTAB_URL;
  const isDownloadsPage = tab.url === DOWNLOADS_URL;

  useEffect(() => {
    // Set title for new tab page
    if (isNewTabPage) {
      onTitleUpdate('Yeni Sekme');
      setIsLoading(false);
      return;
    }
    if (isDownloadsPage) {
      onTitleUpdate('İndirmeler');
      setIsLoading(false);
      return;
    }

    const webview = webviewRef.current;
    if (!webview) return;

    const onDomReady = () => {
      isReadyRef.current = true;
      setIsLoading(false);
      setLoadProgress(100);

      if (mediaPollIntervalRef.current) {
        window.clearInterval(mediaPollIntervalRef.current);
        mediaPollIntervalRef.current = null;
      }

      const wv: any = webview;
      mediaPollIntervalRef.current = window.setInterval(async () => {
        try {
          const currentUrl = wv.getURL?.() || '';
          if (!currentUrl) return;
          const isYoutube = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch|youtu\.be\/)/i.test(currentUrl);
          if (!isYoutube) return;

          const seconds = await wv.executeJavaScript(
            `(() => { try { const v = document.querySelector('video'); return v ? v.currentTime : null; } catch { return null; } })()`,
            true
          );
          if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return;

          window.dispatchEvent(new CustomEvent('tab-media-state', { detail: { tabId: tab.id, url: currentUrl, seconds } }));
        } catch {}
      }, 3000);
    };

    const onTitleUpdated = (e: any) => {
      // Prevent duplicate title updates
      if (e.title && e.title !== lastTitleRef.current) {
        lastTitleRef.current = e.title;
        onTitleUpdate(e.title);
      }
    };

    const onDidStartLoading = () => {
      setIsLoading(true);
      setLoadProgress(10);
    };

    const onLoadCommit = (e: any) => {
      if (e.isMainFrame) {
        setLoadProgress(prev => Math.max(prev, 30));
      }
    };

    // Track history when page finishes loading
    const onDidFinishLoad = () => {
      setIsLoading(false);
      setLoadProgress(100);
      try {
        const wv = webview as any;
        const currentUrl = wv.getURL?.() || tab.url;
        const currentTitle = wv.getTitle?.() || lastTitleRef.current || tab.title;
        
        // Skip internal URLs
        if (!tab.isIncognito && currentUrl && !currentUrl.startsWith('tekeli://') && currentUrl !== 'about:blank') {
          window.electron?.addHistory?.(currentUrl, currentTitle);
        }
      } catch {
        // Silently ignore
      }
    };

    const onDidFailLoad = () => {
      setIsLoading(false);
      setLoadProgress(100);
    };

    const onDidNavigate = (e: any) => {
      const url = e?.url;
      if (typeof url !== 'string' || !url) return;
      onNavigate?.(url);
    };

    const onNavigation = (e: any) => {
      if (!isReadyRef.current || e.detail?.tabId !== tab.id) return;
      
      const wv = webview as any;
      try {
        switch (e.detail.direction) {
          case 'back': wv.canGoBack() && wv.goBack(); break;
          case 'forward': wv.canGoForward() && wv.goForward(); break;
          case 'reload': wv.reload(); break;
        }
      } catch {}
    };

    webview.addEventListener('dom-ready', onDomReady);
    webview.addEventListener('page-title-updated', onTitleUpdated);
    webview.addEventListener('did-start-loading', onDidStartLoading);
    webview.addEventListener('load-commit', onLoadCommit);
    webview.addEventListener('did-finish-load', onDidFinishLoad);
    webview.addEventListener('did-fail-load', onDidFailLoad);
    webview.addEventListener('did-navigate', onDidNavigate as any);
    webview.addEventListener('did-navigate-in-page', onDidNavigate as any);
    window.addEventListener('browser-navigation', onNavigation);

    return () => {
      webview.removeEventListener('dom-ready', onDomReady);
      webview.removeEventListener('page-title-updated', onTitleUpdated);
      webview.removeEventListener('did-start-loading', onDidStartLoading);
      webview.removeEventListener('load-commit', onLoadCommit);
      webview.removeEventListener('did-finish-load', onDidFinishLoad);
      webview.removeEventListener('did-fail-load', onDidFailLoad);
      webview.removeEventListener('did-navigate', onDidNavigate as any);
      webview.removeEventListener('did-navigate-in-page', onDidNavigate as any);
      window.removeEventListener('browser-navigation', onNavigation);
      isReadyRef.current = false;

      if (mediaPollIntervalRef.current) {
        window.clearInterval(mediaPollIntervalRef.current);
        mediaPollIntervalRef.current = null;
      }
    };
  }, [tab.id, tab.url, onTitleUpdate, onNavigate, isNewTabPage, isDownloadsPage]);

  // Handle navigation from NewTabPage
  const handleNewTabNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    }
  };

  // Show NewTabPage for internal newtab URL
  if (isNewTabPage) {
    return (
      <div className="w-full h-full relative z-10">
        <NewTabPage onNavigate={handleNewTabNavigate} activeTheme={activeTheme} activeThemeId={activeThemeId} />
      </div>
    );
  }
  if (isDownloadsPage) {
    return (
      <div className="w-full h-full relative z-10">
        <DownloadsPage activeTheme={activeTheme} activeThemeId={activeThemeId} />
      </div>
    );
  }

  // Show webview for regular URLs
  const partition = tab.isIncognito && tab.partition ? tab.partition : 'persist:webview';
  
  return (
    <div className={`w-full h-full relative overflow-hidden ${activeThemeId === 'light' ? 'bg-white' : 'bg-bg-primary'}`}>
      
      {/* Progress Bar */}
      {isLoading && loadProgress < 100 && (
        <motion.div 
          className="absolute top-0 left-0 h-0.5 z-50 bg-gradient-to-r from-accent-blue to-accent-purple"
          initial={{ width: 0, opacity: 1 }}
          animate={{ width: `${loadProgress}%` }}
          transition={{ ease: "linear", duration: 0.2 }}
        />
      )}

      {/* Loading Skeleton Overlay */}
      <AnimatePresence>
        {isLoading && (
          <SkeletonScreen activeTheme={activeTheme} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 0.98 : 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full h-full relative z-20"
      >
        <webview
          ref={webviewRef as any}
          src={tab.url}
          className="w-full h-full"
          partition={partition}
          // @ts-ignore
          allowpopups="false"
        />
      </motion.div>
    </div>
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.tab;
  const next = nextProps.tab;
  return prev.id === next.id && prev.url === next.url && prev.partition === next.partition && prev.isLoading === next.isLoading;
});

WebViewContainer.displayName = 'WebViewContainer';

export default WebViewContainer;
