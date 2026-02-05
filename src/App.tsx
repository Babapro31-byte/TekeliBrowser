import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Titlebar from './components/Titlebar';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import BookmarksBar from './components/BookmarksBar';
import WebViewContainer from './components/WebViewContainer';
import AISidebar from './components/AISidebar';

export interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
}

const NEWTAB_URL = 'tekeli://newtab';

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: 'Yeni Sekme',
      url: NEWTAB_URL,
      isLoading: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [splitView, setSplitView] = useState(false);
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const secondaryTab = secondaryTabId ? tabs.find(tab => tab.id === secondaryTabId) : null;

  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'Yeni Sekme',
      url: NEWTAB_URL,
      isLoading: false
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    if (newTabs.length === 0) {
      const defaultTab: Tab = {
        id: Date.now().toString(),
        title: 'Yeni Sekme',
        url: NEWTAB_URL,
        isLoading: false
      };
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
    } else {
      setTabs(newTabs);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[0].id);
      }
      if (secondaryTabId === tabId) {
        setSecondaryTabId(null);
        setSplitView(false);
      }
    }
  };

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
      <Titlebar />
      
      <TabBar 
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={closeTab}
        onAddTab={addTab}
      />
      
      <AddressBar 
        currentUrl={activeTab?.url || ''}
        onNavigate={(url) => updateTabUrl(activeTabId, url)}
        onBack={() => navigateTab('back')}
        onForward={() => navigateTab('forward')}
        onReload={() => navigateTab('reload')}
        onToggleSplitView={toggleSplitView}
        splitViewActive={splitView}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
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
      </div>
    </div>
  );
}

export default App;
