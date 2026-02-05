import { useEffect, useRef, memo } from 'react';
import type { Tab } from '../App';

interface WebViewContainerProps {
  tab: Tab;
  onTitleUpdate: (title: string) => void;
}

// Memoized component to prevent unnecessary re-renders
const WebViewContainer = memo(({ tab, onTitleUpdate }: WebViewContainerProps) => {
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const isReadyRef = useRef(false);
  const lastTitleRef = useRef('');

  useEffect(() => {
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
  }, [tab.id, onTitleUpdate]);

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
