import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import type { Tab } from '../App';
import RecentlyClosedMenu from './RecentlyClosedMenu';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
  onReopenTab?: (url: string, title: string) => void;
}

const TabBar = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onAddTab,
  onReopenTab,
}: TabBarProps) => {
  const getTabIcon = (tab: Tab) => {
    if (tab.url === 'tekeli://newtab') return 'shield';
    if (tab.url === 'tekeli://downloads') return 'download';
    if (tab.url === 'tekeli://ayarlar') return 'settings';
    if (/^https:\/\//i.test(tab.url)) return 'lock';
    if (/^http:\/\//i.test(tab.url)) return 'language';
    return 'description';
  };

  const renderTab = (tab: Tab) => {
    const isActive = tab.id === activeTabId;
    const tabIcon = getTabIcon(tab);

    return (
      <motion.div
        key={tab.id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, width: 0, padding: 0, margin: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`
          group relative flex items-center h-9 px-4 gap-2 min-w-[160px] max-w-[220px] cursor-pointer
          rounded-lg transition-all duration-200 ease-in-out
          ${isActive
            ? 'bg-surface-container-highest'
            : 'bg-surface-container-low text-secondary hover:bg-surface-container-highest'}
        `}
        onClick={() => onTabClick(tab.id)}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTabClick(tab.id);
          }
        }}
      >
        {isActive && (
          <div className="absolute inset-x-3 top-0 h-[2px] bg-primary rounded-full" />
        )}

        <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
          {tab.isLoading ? (
            <div
              className="w-3.5 h-3.5 rounded-full border border-outline/40 border-t-primary animate-spin"
              role="status"
              aria-label="Yükleniyor"
            />
          ) : (
            <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden="true">
              {tabIcon}
            </span>
          )}
        </div>

        <span className={`
          text-xs font-medium truncate flex-1 transition-colors
          ${isActive ? 'text-primary' : 'text-secondary group-hover:text-primary'}
        `}>
          {tab.title}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTabClose(tab.id);
          }}
          aria-label={`Sekmeyi kapat: ${tab.title}`}
          className={`
            ml-auto h-5 w-5 rounded-md flex items-center justify-center
            opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-100
            hover:bg-surface-container-low hover:text-primary
          `}
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
        </button>
      </motion.div>
    );
  };

  return (
    <div
      role="tablist"
      aria-label="Açık sekmeler"
      className={`
      h-10 flex-row items-center px-3 gap-1 flex-shrink-0
      flex overflow-x-auto overflow-y-hidden scrollbar-hide
      bg-background border-b border-outline/10
    `}>
      <AnimatePresence mode="popLayout">
        {tabs.map(tab => renderTab(tab))}
      </AnimatePresence>

      <motion.button
        onClick={onAddTab}
        aria-label="Yeni sekme"
        className={`
          flex-shrink-0 flex items-center justify-center
          rounded-md text-secondary hover:text-primary hover:bg-surface-container-highest
          transition-all duration-200 w-8 h-8
        `}
        title="Yeni Sekme (Ctrl+T)"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
      </motion.button>

      {onReopenTab && (
        <RecentlyClosedMenu onReopen={onReopenTab}>
          <motion.button
            aria-label="Son kapatılan sekmeler"
            className={`
              flex-shrink-0 flex items-center justify-center
              rounded-md text-secondary hover:text-primary
              hover:bg-surface-container-highest transition-colors duration-200
              w-8 h-8
            `}
            title="Son Kapatılanlar (Ctrl+Shift+T)"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </motion.button>
        </RecentlyClosedMenu>
      )}
    </div>
  );
};

export default TabBar;
