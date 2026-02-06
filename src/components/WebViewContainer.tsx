import { useEffect, useRef, memo } from 'react';
import type { Tab } from '../App';
import NewTabPage from './NewTabPage';

// Special internal URLs
const NEWTAB_URL = 'tekeli://newtab';

interface WebViewContainerProps {
  tab: Tab;
  onTitleUpdate: (title: string) => void;
  onNavigate?: (url: string) => void;
}

// Memoized component to prevent unnecessary re-renders
const WebViewContainer = memo(({ tab, onTitleUpdate, onNavigate }: WebViewContainerProps) => {
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const isReadyRef = useRef(false);
  const lastTitleRef = useRef('');

  // Check if this is the new tab page
  const isNewTabPage = tab.url === NEWTAB_URL;

  useEffect(() => {
    // Set title for new tab page
    if (isNewTabPage) {
      onTitleUpdate('Yeni Sekme');
      return;
    }

    const webview = webviewRef.current;
    if (!webview) return;

    const onDomReady = () => {
      isReadyRef.current = true;
    };

    const onTitleUpdated = (e: any) => {
      // Prevent duplicate title updates
      if (e.title && e.title !== lastTitleRef.current) {
        lastTitleRef.current = e.title;
        onTitleUpdate(e.title);
      }
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
    window.addEventListener('browser-navigation', onNavigation);

    return () => {
      webview.removeEventListener('dom-ready', onDomReady);
      webview.removeEventListener('page-title-updated', onTitleUpdated);
      window.removeEventListener('browser-navigation', onNavigation);
      isReadyRef.current = false;
    };
  }, [tab.id, tab.url, onTitleUpdate, isNewTabPage]);

  // Handle navigation from NewTabPage
  const handleNewTabNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    }
  };

  // Show NewTabPage for internal newtab URL
  if (isNewTabPage) {
    return (
      <div className="w-full h-full">
        <NewTabPage onNavigate={handleNewTabNavigate} />
      </div>
    );
  }

  // Show webview for regular URLs
  return (
    <div className="w-full h-full bg-dark-bg">
      <webview
        ref={webviewRef as any}
        src={tab.url}
        className="w-full h-full"
        partition="persist:browser"
        // @ts-ignore
        allowpopups="false"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if tab.id or tab.url changes
  return prevProps.tab.id === nextProps.tab.id && 
         prevProps.tab.url === nextProps.tab.url;
});

WebViewContainer.displayName = 'WebViewContainer';

export default WebViewContainer;
