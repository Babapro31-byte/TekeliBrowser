import { motion, AnimatePresence } from 'framer-motion';
import type { Tab } from '../App';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
}

const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose, onAddTab }: TabBarProps) => {
  return (
    <div className="h-10 bg-dark-surface/60 backdrop-blur-md border-b border-neon-blue/10 flex items-center px-2 gap-1 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {tabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            layout
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0, marginLeft: 0, marginRight: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut', layout: { duration: 0.2 } }}
            style={{ zIndex: tab.id === activeTabId ? 10 : tabs.length - index }}
            className={`
              group relative h-8 px-3 flex items-center gap-2 flex-shrink-0
              rounded-lg cursor-pointer transition-colors duration-150 overflow-hidden
              ${tab.id === activeTabId 
                ? 'bg-dark-hover/90 border border-neon-blue/30 shadow-lg shadow-neon-blue/10' 
                : 'bg-dark-surface/50 hover:bg-dark-hover/50 border border-transparent'
              }
            `}
            onClick={() => onTabClick(tab.id)}
          >
            {/* Favicon placeholder */}
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-neon-blue/50 to-neon-purple/50 flex-shrink-0" />
            
            {/* Tab Title */}
            <span className={`text-xs truncate max-w-[140px] whitespace-nowrap ${
              tab.id === activeTabId ? 'text-white' : 'text-white/70'
            }`}>
              {tab.title}
            </span>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/30 transition-all flex-shrink-0"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60 hover:text-white">
                <path d="M1 1L7 7M7 1L1 7" />
              </svg>
            </button>
            
            {/* Active Tab Indicator */}
            {tab.id === activeTabId && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Add Tab Button */}
      <motion.button
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddTab}
        className="w-8 h-8 rounded-lg bg-dark-surface/50 hover:bg-dark-hover/50 border border-transparent hover:border-neon-blue/30 flex items-center justify-center text-neon-blue transition-all flex-shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 1V11M1 6H11" />
        </svg>
      </motion.button>
    </div>
  );
};

export default TabBar;
