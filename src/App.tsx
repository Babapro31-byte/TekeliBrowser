import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Titlebar from './components/Titlebar';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import BookmarksBar from './components/BookmarksBar';
import WebViewContainer from './components/WebViewContainer';
import AISidebar from './components/AISidebar';
import HistoryPanel from './components/HistoryPanel';
import PermissionPrompt from './components/PermissionPrompt';
import PrivacySettings from './components/PrivacySettings';
import UpdateNotification from './components/UpdateNotification';

export interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  isIncognito?: boolean;
  partition?: string;
}

// Default URL for new tabs
const DEFAULT_URL = 'tekeli://newtab';

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
  const [splitView, setSplitView] = useState(false);
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);

  // Keep refs in sync
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const secondaryTab = secondaryTabId ? tabs.find(tab => tab.id === secondaryTabId) : null;

  // --- Session Restore on mount ---
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
          // Session never contains incognito tabs
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
          console.log(`[App] Restored ${restoredTabs.length} tabs`);
        }
      } catch (err) {
        console.error('[App] Session restore failed:', err);
      }
      setSessionRestored(true);
    };
    
    restore();
  }, [sessionRestored]);

  // --- Auto-save session every 30s ---
  useEffect(() => {
    if (!sessionRestored) return;

    const saveCurrentSession = () => {
      if (!window.electron?.saveSession) return;
      // Exclude incognito tabs from session restore
      const currentTabs = tabsRef.current
        .filter(t => !t.isIncognito)
        .map(t => ({ id: t.id, title: t.title, url: t.url }));
      window.electron.saveSession(currentTabs, activeTabIdRef.current);
    };

    const interval = setInterval(saveCurrentSession, 30000);

    // Save on beforeunload
    const handleBeforeUnload = () => saveCurrentSession();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionRestored]);

  // --- Popup redirect to new tab ---
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

  // --- Keyboard shortcuts from main process ---
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
        case 'new-incognito-tab':
          addIncognitoTabFn();
          break;
        case 'toggle-history':
          setHistoryOpen(prev => !prev);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addIncognitoTabFn = useCallback(async () => {
    if (!window.electron?.createIncognitoPartition) return;
    try {
      const { partition } = await window.electron.createIncognitoPartition();
      const newTab: Tab = {
        id: Date.now().toString(),
        title: 'Gizli Sekme',
        url: DEFAULT_URL,
        isLoading: false,
        isIncognito: true,
        partition
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    } catch (err) {
      console.error('[App] Create incognito tab failed:', err);
    }
  }, []);

  const closeTabFn = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const closedTab = prevTabs.find(t => t.id === tabId);
      
      // Clear incognito session when closing incognito tab
      if (closedTab?.isIncognito && closedTab?.partition && window.electron?.clearIncognitoSession) {
        window.electron.clearIncognitoSession(closedTab.partition);
      }
      
      // Track closed tab (not incognito)
      if (closedTab && !closedTab.isIncognito && window.electron?.tabClosed) {
        window.electron.tabClosed({ title: closedTab.title, url: closedTab.url });
      }
      
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
    
    setSecondaryTabId(prev => {
      if (prev === tabId) {
        setSplitView(false);
        return null;
      }
      return prev;
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

  const updateTabUrl = (tabId: string, url: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, url, isLoading: true } : tab
    ));
  };

  const updateTabTitle = (tabId: string, title: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, title, isLoading: false } : tab
    ));
  };

  const toggleSplitView = () => {
    if (!splitView && tabs.length > 1) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setSecondaryTabId(tabs[nextIndex].id);
    } else if (splitView) {
      setSecondaryTabId(null);
    }
    setSplitView(!splitView);
  };

  const navigateTab = (direction: 'back' | 'forward' | 'reload') => {
    const event = new CustomEvent('browser-navigation', { 
      detail: { direction, tabId: activeTabId } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="w-full h-screen bg-dark-bg flex flex-col overflow-hidden">
      {/* Auto-updater notification */}
      <UpdateNotification />
      
      <Titlebar />
      
      <TabBar 
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={closeTab}
        onAddTab={addTab}
        onAddIncognitoTab={addIncognitoTabFn}
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
      
      <PermissionPrompt />
      
      <AddressBar 
        currentUrl={activeTab?.url || ''}
        onNavigate={(url) => updateTabUrl(activeTabId, url)}
        onBack={() => navigateTab('back')}
        onForward={() => navigateTab('forward')}
        onReload={() => navigateTab('reload')}
        onToggleSplitView={toggleSplitView}
        splitViewActive={splitView}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenPrivacySettings={() => setPrivacySettingsOpen(true)}
      />
      
      <BookmarksBar onNavigate={(url) => updateTabUrl(activeTabId, url)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex h-full ${splitView ? 'w-full' : 'flex-1'} transition-all duration-300`}>
          <motion.div 
            className={`h-full ${splitView ? 'w-1/2 border-r border-neon-blue/20' : 'w-full'}`}
            layout
          >
            {activeTab && (
              <WebViewContainer 
                tab={activeTab}
                onTitleUpdate={(title) => updateTabTitle(activeTab.id, title)}
                onNavigate={(url) => updateTabUrl(activeTab.id, url)}
              />
            )}
          </motion.div>
          
          <AnimatePresence>
            {splitView && secondaryTab && (
              <motion.div 
                className="w-1/2 h-full"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <WebViewContainer 
                  tab={secondaryTab}
                  onTitleUpdate={(title) => updateTabTitle(secondaryTab.id, title)}
                  onNavigate={(url) => updateTabUrl(secondaryTab.id, url)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AISidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <HistoryPanel 
          isOpen={historyOpen} 
          onClose={() => setHistoryOpen(false)} 
          onNavigate={(url) => updateTabUrl(activeTabId, url)}
        />
        
        <PrivacySettings 
          isOpen={privacySettingsOpen} 
          onClose={() => setPrivacySettingsOpen(false)} 
        />
      </div>
    </div>
  );
}

export default App;
