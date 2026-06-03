import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { Tab } from '../App';
import NewTabPage from './NewTabPage';
import DownloadsPage from './DownloadsPage';

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 3.0;
const ZOOM_DEFAULT = 1.0;

function getZoomKey(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isSearchResultsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    return (
      (host === 'duckduckgo.com' && parsed.searchParams.has('q')) ||
      (host === 'google.com' && parsed.pathname.startsWith('/search')) ||
      (host.endsWith('.google.com') && parsed.pathname.startsWith('/search')) ||
      (host === 'bing.com' && parsed.pathname.startsWith('/search'))
    );
  } catch {
    return false;
  }
}

function loadZoom(url: string): number {
  try {
    const key = `zoom:${getZoomKey(url)}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const val = parseFloat(stored);
      if (Number.isFinite(val) && val >= ZOOM_MIN && val <= ZOOM_MAX) {
        return isSearchResultsUrl(url) ? Math.max(ZOOM_DEFAULT, val) : val;
      }
    }
  } catch {}
  const defaultZoomStr = localStorage.getItem('tekeli:defaultZoom');
  const defaultZoom = defaultZoomStr ? parseFloat(defaultZoomStr) : ZOOM_DEFAULT;
  const validDefault = Number.isFinite(defaultZoom) && defaultZoom >= ZOOM_MIN && defaultZoom <= ZOOM_MAX
    ? defaultZoom
    : ZOOM_DEFAULT;
  return isSearchResultsUrl(url) ? Math.max(ZOOM_DEFAULT, validDefault) : validDefault;
}

function saveZoom(url: string, zoom: number): void {
  try {
    const key = `zoom:${getZoomKey(url)}`;
    const normalizedZoom = isSearchResultsUrl(url) ? Math.max(ZOOM_DEFAULT, zoom) : zoom;
    if (Math.abs(normalizedZoom - ZOOM_DEFAULT) < 0.001) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(normalizedZoom));
    }
  } catch {}
}

const NEWTAB_URL = 'tekeli://newtab';
const DOWNLOADS_URL = 'tekeli://downloads';

interface WebViewContainerProps {
  tab: Tab;
  onTitleUpdate: (title: string) => void;
  onNavigate?: (url: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const SkeletonScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-30 p-8 flex flex-col gap-6 bg-background"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-surface-container-high/20 animate-pulse-slow overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-6 w-1/3 rounded-lg bg-surface-container-high/20 animate-pulse-slow overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>
        <div className="h-4 w-1/4 rounded-lg bg-surface-container-high/20 animate-pulse-slow overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>
      </div>
    </div>

    <div className="flex-1 flex gap-6 mt-8">
      <div className="w-64 flex flex-col gap-4 hidden md:flex">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 w-full rounded-lg bg-surface-container-high/20 animate-pulse-slow overflow-hidden relative" style={{ opacity: 1 - i * 0.1 }}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          </div>
        ))}
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        <div className="w-full h-64 rounded-2xl bg-surface-container-high/20 animate-pulse-slow overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-full h-48 rounded-2xl bg-surface-container-high/20 animate-pulse-slow overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const WebViewContainer = memo(({ tab, onTitleUpdate, onNavigate, onLoadingChange }: WebViewContainerProps) => {
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const isReadyRef = useRef(false);
  const lastTitleRef = useRef('');
  const mediaPollIntervalRef = useRef<number | null>(null);
  // En güncel onLoadingChange'i ref'te tut: yükleme olay dinleyicilerini
  // her render'da yeniden bağlamadan parent'a (tab.isLoading) bildirim yapabilmek için.
  const onLoadingChangeRef = useRef(onLoadingChange);
  useEffect(() => { onLoadingChangeRef.current = onLoadingChange; }, [onLoadingChange]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [zoom, setZoom] = useState<number>(ZOOM_DEFAULT);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const zoomHideTimer = useRef<number | null>(null);

  const isNewTabPage = tab.url === NEWTAB_URL;
  const isDownloadsPage = tab.url === DOWNLOADS_URL;

  const applyZoom = useCallback((wv: any, zoomLevel: number) => {
    try {
      wv.setZoomFactor?.(zoomLevel);
    } catch {}
  }, []);

  const changeZoom = useCallback((delta: number) => {
    const wv = webviewRef.current as any;
    if (!wv) return;
    setZoom(prev => {
      const next = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta)) * 10) / 10;
      applyZoom(wv, next);
      saveZoom(tab.url, next);
      return next;
    });
    setShowZoomControls(true);
    if (zoomHideTimer.current) window.clearTimeout(zoomHideTimer.current);
    zoomHideTimer.current = window.setTimeout(() => setShowZoomControls(false), 2500);
  }, [applyZoom, tab.url]);

  const resetZoom = useCallback(() => {
    const wv = webviewRef.current as any;
    if (!wv) return;
    applyZoom(wv, ZOOM_DEFAULT);
    saveZoom(tab.url, ZOOM_DEFAULT);
    setZoom(ZOOM_DEFAULT);
    setShowZoomControls(true);
    if (zoomHideTimer.current) window.clearTimeout(zoomHideTimer.current);
    zoomHideTimer.current = window.setTimeout(() => setShowZoomControls(false), 2500);
  }, [applyZoom, tab.url]);

  useEffect(() => {
    if (isNewTabPage || isDownloadsPage) return;
    const savedZoom = loadZoom(tab.url);
    setZoom(savedZoom);
    const wv = webviewRef.current as any;
    if (wv && isReadyRef.current) {
      applyZoom(wv, savedZoom);
    }
  }, [tab.url, isNewTabPage, isDownloadsPage, applyZoom]);

  useEffect(() => {
    if (isNewTabPage || isDownloadsPage) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      changeZoom(delta);
    };
    const container = webviewRef.current?.parentElement;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isNewTabPage, isDownloadsPage, changeZoom]);

  useEffect(() => {
    if (isNewTabPage || isDownloadsPage) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.tabId !== tab.id) return;
      switch (ce.detail?.action) {
        case 'zoom-in': changeZoom(ZOOM_STEP); break;
        case 'zoom-out': changeZoom(-ZOOM_STEP); break;
        case 'zoom-reset': resetZoom(); break;
      }
    };
    window.addEventListener('webview-zoom', handler as any);
    return () => window.removeEventListener('webview-zoom', handler as any);
  }, [isNewTabPage, isDownloadsPage, tab.id, changeZoom, resetZoom]);

  useEffect(() => {
    if (!isNewTabPage && !isDownloadsPage) {
      setIsLoading(true);
      setLoadProgress(10);
      onLoadingChangeRef.current?.(true);
    }
  }, [tab.url, isNewTabPage, isDownloadsPage]);

  useEffect(() => {
    if (isNewTabPage) {
      onTitleUpdate('Yeni Sekme');
      setIsLoading(false);
      onLoadingChangeRef.current?.(false);
      return;
    }
    if (isDownloadsPage) {
      onTitleUpdate('İndirmeler');
      setIsLoading(false);
      onLoadingChangeRef.current?.(false);
      return;
    }

    const webview = webviewRef.current;
    if (!webview) return;

    const onDomReady = () => {
      isReadyRef.current = true;
      setIsLoading(false);
      setLoadProgress(100);
      onLoadingChangeRef.current?.(false);

      const wv: any = webview;
      const savedZoom = loadZoom(tab.url);
      setZoom(savedZoom);
      applyZoom(wv, savedZoom);

      if (mediaPollIntervalRef.current) {
        window.clearInterval(mediaPollIntervalRef.current);
        mediaPollIntervalRef.current = null;
      }
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
      if (e.title && e.title !== lastTitleRef.current) {
        lastTitleRef.current = e.title;
        onTitleUpdate(e.title);
      }
    };

    const onDidStartLoading = () => {
      setIsLoading(true);
      setLoadProgress(10);
      onLoadingChangeRef.current?.(true);
    };

    const onDidStopLoading = () => {
      setIsLoading(false);
      setLoadProgress(100);
      onLoadingChangeRef.current?.(false);
    };

    const onLoadCommit = (e: any) => {
      if (e.isMainFrame) {
        setLoadProgress(prev => Math.max(prev, 30));
      }
    };

    const onDidFinishLoad = () => {
      setIsLoading(false);
      setLoadProgress(100);
      onLoadingChangeRef.current?.(false);
      try {
        const wv = webview as any;
        const currentUrl = wv.getURL?.() || tab.url;
        const currentTitle = wv.getTitle?.() || lastTitleRef.current || tab.title;
        
        if (currentUrl && !currentUrl.startsWith('tekeli://') && currentUrl !== 'about:blank') {
          window.electron?.addHistory?.(currentUrl, currentTitle);
        }
      } catch {}
    };

    const onDidFailLoad = (e: any) => {
      if (e?.isMainFrame !== false) {
        setIsLoading(false);
        setLoadProgress(100);
        onLoadingChangeRef.current?.(false);
      }
    };

    const onDidNavigate = (e: any) => {
      const url = e?.url;
      if (typeof url !== 'string' || !url) return;
      onNavigate?.(url);
    };

    const onNavigation = (e: any) => {
      if (e.detail?.tabId !== tab.id) return;
      
      const wv = webview as any;
      try {
        switch (e.detail.direction) {
          case 'back':
            if (wv.canGoBack?.()) wv.goBack();
            break;
          case 'forward':
            if (wv.canGoForward?.()) wv.goForward();
            break;
          case 'reload':
            wv.reload?.();
            break;
        }
      } catch {}
    };

    webview.addEventListener('dom-ready', onDomReady);
    webview.addEventListener('page-title-updated', onTitleUpdated);
    webview.addEventListener('did-start-loading', onDidStartLoading);
    webview.addEventListener('did-stop-loading', onDidStopLoading);
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
      webview.removeEventListener('did-stop-loading', onDidStopLoading);
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

  const handleNewTabNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    }
  };

  if (isNewTabPage) {
    return (
      <div className="w-full h-full relative z-10">
        <NewTabPage onNavigate={handleNewTabNavigate} />
      </div>
    );
  }
  if (isDownloadsPage) {
    return (
      <div className="w-full h-full relative z-10">
        <DownloadsPage />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-background overflow-hidden">

      {/*
        Webview her zaman tam-kaplama ve TRANSFORM'SUZ bir kapsayıcıda durur.
        Electron <webview> öğesi CSS transform taşıyan bir ata içinde guest içeriği
        yanlış (küçük) boyutlandırır; bu yüzden burada scale/opacity animasyonu YOK.
        Yükleme animasyonu ayrı bir overlay (SkeletonScreen) ile üstte yapılır.
      */}
      <div className="absolute inset-0 z-0">
        <webview
          ref={webviewRef as any}
          src={tab.url}
          className="w-full h-full"
          partition="persist:webview"
          allowpopups="false"
        />
      </div>

      {isLoading && loadProgress < 100 && (
        <motion.div
          className="absolute top-0 left-0 h-0.5 z-40 flare-gradient"
          initial={{ width: 0, opacity: 1 }}
          animate={{ width: `${loadProgress}%` }}
          transition={{ ease: "linear", duration: 0.2 }}
        />
      )}

      <AnimatePresence>
        {isLoading && (
          <SkeletonScreen />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showZoomControls && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-4 right-4 z-40 flex items-center gap-1 px-2 py-1 rounded-xl bg-surface-container-high/90 backdrop-blur-sm border border-outline/15 shadow-lg"
          >
            <button
              onClick={() => changeZoom(-ZOOM_STEP)}
              title="Kucult (Ctrl+-)"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={resetZoom}
              title="Sifirla (100%)"
              className="min-w-[3.5rem] h-7 px-1 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => changeZoom(ZOOM_STEP)}
              title="Buyut (Ctrl++)"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <ZoomIn size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.tab;
  const next = nextProps.tab;
  return prev.id === next.id && prev.url === next.url && prev.isLoading === next.isLoading;
});

WebViewContainer.displayName = 'WebViewContainer';

export default WebViewContainer;
