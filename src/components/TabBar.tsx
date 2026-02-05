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
    <div className="h-10 bg-dark-surface/60 backdrop-blur-md border-b border-neon-blue/10 flex items-center px-2 overflow-x-auto">
      <AnimatePresence mode="popLayout">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`
              group relative min-w-[160px] max-w-[240px] h-8 mx-1 px-3 flex items-center justify-between
              rounded-t-lg cursor-pointer transition-all
              ${tab.id === activeTabId 
                ? 'glass neon-glow bg-dark-hover/80' 
                : 'bg-dark-surface/40 hover:bg-dark-hover/40'
              }
            `}
            onClick={() => onTabClick(tab.id)}
          >
            {/* Favicon placeholder */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-neon-blue/50 to-neon-purple/50 flex-shrink-0" />
              
              {/* Tab Title */}
              <span className="text-xs text-white/80 truncate flex-1">
                {tab.title}
              </span>
            </div>
            
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-2 w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-opacity flex-shrink-0"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60">
                <path d="M1 1L7 7M7 1L1 7" />
              </svg>
            </motion.button>
            
            {/* Active Tab Indicator */}
            {tab.id === activeTabId && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Add Tab Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddTab}
        className="ml-2 w-8 h-8 rounded-lg glass hover:neon-glow flex items-center justify-center text-neon-blue transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 1V13M1 7H13" />
        </svg>
      </motion.button>
    </div>
  );
};

export default TabBar;
