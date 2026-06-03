import { useState, useEffect, useCallback, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import Titlebar from './components/Titlebar';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import BookmarksBar from './components/BookmarksBar';
import WebViewContainer from './components/WebViewContainer';
import HistoryPanel from './components/HistoryPanel';
import BookmarksPanel from './components/BookmarksPanel';
import PermissionPrompt from './components/PermissionPrompt';
import UpdateNotification from './components/UpdateNotification';
import SettingsPanel from './components/SettingsPanel';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import type { SessionData } from './types/electron';
import { loadStoredTheme } from './utils/theme';

export interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
}

const DEFAULT_URL = 'tekeli://newtab';
const DOWNLOADS_URL = 'tekeli://downloads';
const SETTINGS_URL = 'tekeli://ayarlar';

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: 'Yeni Sekme',
      url: DEFAULT_URL,
      isLoading: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [settingsSection, setSettingsSection] = useState('general');
  const tabsRef = useRef(tabs);

  const activeTabIdRef = useRef(activeTabId);
  const addressBarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { tabsRef.current = tabs; }, [tabs]);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  useEffect(() => { loadStoredTheme(); }, []);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const dispatchNavigation = useCallback((direction: 'back' | 'forward' | 'reload') => {
    window.dispatchEvent(new CustomEvent('browser-navigation', {
      detail: { direction, tabId: activeTabIdRef.current }
    }));
  }, []);

  const applyRestoredSession = useCallback((session: SessionData) => {
    const restoredTabs: Tab[] = session.tabs.map(t => ({
      id: t.id || Date.now().toString() + Math.random(),
      title: t.title || 'Yeni Sekme',
      url: t.url || DEFAULT_URL,
      isLoading: false
    }));
    setTabs(restoredTabs);
    const restoredActiveId = session.activeTabId && restoredTabs.find(t => t.id === session.activeTabId)
      ? session.activeTabId
      : restoredTabs[0].id;
    setActiveTabId(restoredActiveId);
  }, []);

  useEffect(() => {
    if (sessionRestored) return;
    
    const restore = async () => {
      try {
        if (!window.electron?.restoreSession) {
          setSessionRestored(true);
          return;
        }
        const session = await window.electron.restoreSession();
        if (session && session.tabs && session.tabs.length > 0) {
          applyRestoredSession(session);
          console.log(`[App] Restored ${session.tabs.length} tabs`);
        }
      } catch (err) {
        console.error('[App] Session restore failed:', err);
      }
      setSessionRestored(true);
    };
    
    restore();
  }, [sessionRestored, applyRestoredSession]);

  useEffect(() => {
    if (!sessionRestored) return;

    const saveCurrentSession = () => {
      if (!window.electron?.saveSession) return;
      const currentTabs = tabsRef.current.map(t => ({ id: t.id, title: t.title, url: t.url }));
      window.electron.saveSession(currentTabs, activeTabIdRef.current);
    };

    const interval = setInterval(saveCurrentSession, 30000);

    const handleBeforeUnload = () => saveCurrentSession();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionRestored]);

  useEffect(() => {
    if (!window.electron?.onOpenUrlInNewTab) return;
    const cleanup = window.electron.onOpenUrlInNewTab((url: string) => {
      const newTab: Tab = {
        id: Date.now().toString(),
        title: 'Yeni Sekme',
        url: url || DEFAULT_URL,
        isLoading: false
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (!window.electron?.onShortcut) return;
    
    const cleanup = window.electron.onShortcut((data) => {
      switch (data.action) {
        case 'new-tab':
          addTabFn();
          break;
        case 'close-tab':
          closeTabFn(activeTabIdRef.current);
          break;
        case 'reopen-tab':
          reopenLastClosedTab();
          break;
        case 'toggle-history':
          setHistoryOpen(prev => !prev);
          break;
        case 'focus-addressbar':
          addressBarInputRef.current?.focus();
          addressBarInputRef.current?.select();
          break;
        case 'reload':
          window.dispatchEvent(new CustomEvent('browser-navigation', { 
            detail: { direction: 'reload', tabId: activeTabIdRef.current } 
          }));
          break;
        case 'next-tab': {
          const currentTabs = tabsRef.current;
          const idx = currentTabs.findIndex(t => t.id === activeTabIdRef.current);
          if (idx >= 0 && currentTabs.length > 1) {
            const nextIdx = (idx + 1) % currentTabs.length;
            setActiveTabId(currentTabs[nextIdx].id);
          }
          break;
        }
        case 'prev-tab': {
          const currentTabs = tabsRef.current;
          const idx = currentTabs.findIndex(t => t.id === activeTabIdRef.current);
          if (idx >= 0 && currentTabs.length > 1) {
            const prevIdx = (idx - 1 + currentTabs.length) % currentTabs.length;
            setActiveTabId(currentTabs[prevIdx].id);
          }
          break;
        }
      }
    });

    return cleanup;
  }, []);

  const addTabFn = useCallback(() => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'Yeni Sekme',
      url: DEFAULT_URL,
      isLoading: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const addTab = addTabFn;

  const closeTabFn = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      if (newTabs.length === 0) {
        const defaultTab: Tab = {
          id: Date.now().toString(),
          title: 'Yeni Sekme',
          url: DEFAULT_URL,
          isLoading: false
        };
        setActiveTabId(defaultTab.id);
        return [defaultTab];
      }
      
      setActiveTabId(prev => {
        if (prev === tabId) return newTabs[0].id;
        return prev;
      });
      
      return newTabs;
    });
  }, []);

  const closeTab = closeTabFn;

  const reopenLastClosedTab = useCallback(async () => {
    if (!window.electron?.getRecentlyClosed) return;
    try {
      const closed = await window.electron.getRecentlyClosed();
      if (closed && closed.length > 0) {
        const last = closed[0];
        const newTab: Tab = {
          id: Date.now().toString(),
          title: last.title,
          url: last.url,
          isLoading: false
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
    } catch (err) {
      console.error('[App] Reopen tab failed:', err);
    }
  }, []);

  // URL güncellemesi yükleme durumunu YÖNETMEZ; isLoading artık tek kaynak olan
  // WebViewContainer'ın gerçek webview olaylarından (onLoadingChange) gelir.
  // Tek istisna: Ayarlar yerel bir paneldir (webview yok), bu yüzden onu false'a sabitliyoruz.
  const updateTabUrl = useCallback((tabId: string, url: string) => {
    const isSettings = url === SETTINGS_URL;
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, url, title: isSettings ? 'Ayarlar' : tab.title, isLoading: isSettings ? false : tab.isLoading }
        : tab
    ));
  }, []);

  // Yükleme durumunun tek otoritesi. Değer değişmiyorsa yeni nesne üretmeyerek
  // gereksiz yeniden render'ları önler.
  const setTabLoading = useCallback((tabId: string, loading: boolean) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? (tab.isLoading === loading ? tab : { ...tab, isLoading: loading })
        : tab
    ));
  }, []);

  const openSettings = useCallback((section: string = 'general') => {
    const targetId = activeTabIdRef.current;
    setTabs(prev => prev.map(t => (t.id === targetId ? { ...t, url: SETTINGS_URL, title: 'Ayarlar', isLoading: false } : t)));
    setActiveTabId(targetId);
    setSettingsSection(section);
  }, []);

  const goHome = useCallback(() => {
    const targetId = activeTabIdRef.current;
    setTabs(prev => prev.map(t => (
      t.id === targetId
        ? { ...t, url: DEFAULT_URL, title: 'Yeni Sekme', isLoading: false }
        : t
    )));
    setActiveTabId(targetId);
  }, []);

  // Başlık güncellemesi artık yükleme durumuna dokunmaz (eski hatanın kaynağıydı).
  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, title } : tab
    ));
  }, []);

  const openDownloadsTab = useCallback(() => {
    const existing = tabsRef.current.find(t => t.url === DOWNLOADS_URL);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'İndirmeler',
      url: DOWNLOADS_URL,
      isLoading: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  useEffect(() => {
    const handleUiAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: string }>;
      switch (customEvent.detail?.action) {
        case 'open-bookmarks':
          setBookmarksOpen(true);
          break;
        case 'open-history':
          setHistoryOpen(true);
          break;
        case 'open-downloads':
          openDownloadsTab();
          break;
        case 'open-settings':
          openSettings();
          break;
      }
    };

    window.addEventListener('tekeli-ui-action', handleUiAction as EventListener);
    return () => window.removeEventListener('tekeli-ui-action', handleUiAction as EventListener);
  }, [openDownloadsTab, openSettings]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="w-full h-screen flex flex-col overflow-hidden bg-background text-on-surface font-body">
      <UpdateNotification />
      
      <Titlebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onTabClose={closeTab}
          onAddTab={addTab}
          onReopenTab={(url, title) => {
            const newTab: Tab = {
              id: Date.now().toString(),
              title,
              url,
              isLoading: false
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
          }}
        />

        <AddressBar
          currentUrl={activeTab?.url || DEFAULT_URL}
          currentTitle={activeTab?.title}
          onNavigate={(url) => activeTab && updateTabUrl(activeTab.id, url)}
          onBack={() => dispatchNavigation('back')}
          onForward={() => dispatchNavigation('forward')}
          onReload={() => dispatchNavigation('reload')}
          onHome={goHome}
          onOpenDownloads={openDownloadsTab}
          onOpenPrivacySettings={() => openSettings('privacy')}
          onToggleAISidebar={() => setSidebarOpen(prev => !prev)}
          inputRef={addressBarInputRef}
        />

        <PermissionPrompt />

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeTab?.url === DEFAULT_URL && (
            <BookmarksBar onNavigate={(url) => updateTabUrl(activeTabId, url)} />
          )}
          
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            <div className="flex h-full w-full min-w-0 min-h-0 transition-all duration-300">
              {activeTab && (
                activeTab.url === SETTINGS_URL ? (
                  <SettingsPanel initialSection={settingsSection} />
                ) : (
                  <WebViewContainer
                    tab={activeTab}
                    onTitleUpdate={(title) => updateTabTitle(activeTab.id, title)}
                    onNavigate={(url) => updateTabUrl(activeTab.id, url)}
                    onLoadingChange={(loading) => setTabLoading(activeTab.id, loading)}
                  />
                )
              )}
            </div>

            <Sidebar 
              isOpen={sidebarOpen} 
              onToggle={() => setSidebarOpen(!sidebarOpen)} 
              onOpenSettings={openSettings}
              onOpenDownloads={openDownloadsTab}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenBookmarks={() => setBookmarksOpen(true)}
            />
          </div>
        </div>

        <HistoryPanel
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onNavigate={(url) => updateTabUrl(activeTabId, url)}
        />

        <BookmarksPanel
          isOpen={bookmarksOpen}
          onClose={() => setBookmarksOpen(false)}
          onNavigate={(url) => updateTabUrl(activeTabId, url)}
        />
      </div>

      <StatusBar systemStatus="PROTECTED" clusterName="192.168.1.1" />
    </div>
    </MotionConfig>
  );
}

export default App;
