import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Globe, UserX, RotateCcw } from 'lucide-react';
import type { Tab } from '../App';
import RecentlyClosedMenu from './RecentlyClosedMenu';
import type { ThemeDef } from '../utils/themes';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
  onAddIncognitoTab?: () => void;
  onReopenTab?: (url: string, title: string) => void;
  layout?: 'horizontal' | 'vertical';
  activeTheme?: ThemeDef;
}

const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose, onAddTab, onAddIncognitoTab, onReopenTab, layout = 'horizontal', activeTheme }: TabBarProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getFaviconUrl = (url: string) => {
    if (!url || url.startsWith('tekeli://')) return null;
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div 
      className={` 
        ${layout === 'vertical' 
          ? 'h-full flex-col py-4 px-2 flex-shrink-0 transition-all duration-300 ease-spring z-30' 
          : 'h-12 flex-row items-center px-4 gap-2 border-b'}
        ${layout === 'vertical' && isHovered ? 'w-[200px]' : layout === 'vertical' ? 'w-[68px]' : 'w-full'}
        backdrop-blur-md flex overflow-x-auto overflow-y-hidden scrollbar-hide
        ${activeTheme ? activeTheme.panel : 'bg-transparent border-white/5'}
      `}
      onMouseEnter={() => layout === 'vertical' && setIsHovered(true)}
      onMouseLeave={() => layout === 'vertical' && setIsHovered(false)}
    >
      <div className={`flex ${layout === 'vertical' ? 'flex-col gap-1 w-full' : 'flex-row gap-2 h-full items-center'}`}>
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const favUrl = getFaviconUrl(tab.url);
            
            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, scale: 0.8, x: layout === 'vertical' ? -20 : 0, y: layout === 'vertical' ? 0 : 20 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, width: 0, padding: 0, margin: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={` 
                  group relative flex items-center flex-shrink-0 cursor-pointer overflow-hidden transition-all duration-200
                  ${layout === 'vertical' 
                    ? `h-12 w-full rounded-xl ${isHovered ? 'px-3 justify-start' : 'justify-center'}` 
                    : 'h-8 px-3 rounded-lg max-w-[200px] min-w-[120px]'}
                  ${isActive
                    ? (activeTheme ? activeTheme.active : 'bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-accent-blue/50 shadow-glass-glow')
                    : (activeTheme ? `${activeTheme.hover} opacity-70` : 'bg-white/5 hover:bg-white/10 border border-transparent')}
                `}
                onClick={() => onTabClick(tab.id)}
              >
                {/* Active Indicator (Vertical only) */}
                {layout === 'vertical' && isActive && !activeTheme && (
                  <motion.div
                    layoutId="activeTabIndicatorVertical"
                    className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-accent-blue rounded-r-full shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Content Container */}
                <div className={`flex items-center w-full ${layout === 'vertical' && !isHovered ? 'justify-center' : 'gap-2'}`}>
                  
                  {/* Icon / Favicon */}
                  <div className={`flex-shrink-0 flex items-center justify-center rounded-lg transition-transform group-hover:scale-110
                    ${layout === 'vertical' ? 'w-8 h-8' : 'w-5 h-5'}
                    ${!favUrl ? (tab.isIncognito ? 'bg-accent-purple/20 text-accent-purple' : 'bg-white/10 text-gray-300') : ''}
                  `}>
                    {tab.isLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-accent-blue/30 border-t-accent-blue animate-spin" />
                    ) : favUrl ? (
                      <img src={favUrl} alt="" className="w-4 h-4 rounded-sm object-contain" onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }} />
                    ) : tab.isIncognito ? (
                      <UserX size={layout === 'vertical' ? 16 : 14} />
                    ) : (
                      <Globe size={layout === 'vertical' ? 16 : 14} className={favUrl ? 'hidden' : ''} />
                    )}
                  </div>

                  {/* Title */}
                  {(layout === 'horizontal' || isHovered) && (
                    <span className={`text-xs truncate flex-1 transition-colors
                      ${isActive ? 'font-medium text-white' : 'text-gray-400 group-hover:text-gray-200'}
                    `}>
                      {tab.title}
                    </span>
                  )}
                </div>

                {/* Close Button */}
                {(layout === 'horizontal' || isHovered) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                    className={` 
                      absolute right-2 w-5 h-5 rounded-full flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-all
                      hover:bg-red-500/80 hover:text-white
                      ${isActive ? 'text-gray-300' : 'text-gray-400'}
                    `}
                  >
                    <X size={12} />
                  </button>
                )}

                {/* Active Indicator (Horizontal only) */}
                {layout === 'horizontal' && isActive && !activeTheme && (
                  <motion.div
                    layoutId="activeTabIndicatorHorizontal"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-accent-blue to-accent-purple rounded-t-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Tab Actions */}
        <div className={` 
          flex flex-shrink-0
          ${layout === 'vertical' 
            ? `flex-col gap-2 mt-4 pt-4 border-t border-white/10 ${isHovered ? 'px-2' : 'items-center'}` 
            : 'flex-row items-center gap-1 ml-2'}
        `}>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddTab}
            className={` 
              rounded-xl flex items-center justify-center text-gray-400 transition-colors
              border border-dashed border-white/20 hover:border-solid hover:border-accent-blue hover:text-accent-blue hover:bg-accent-blue/10
              ${layout === 'vertical' ? 'w-10 h-10' : 'w-8 h-8'}
            `}
            title="Yeni Sekme"
          >
            <Plus size={layout === 'vertical' ? 20 : 16} />
          </motion.button>
          
          {onAddIncognitoTab && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddIncognitoTab}
              className={` 
                rounded-xl flex items-center justify-center text-gray-400 transition-colors
                hover:text-accent-purple hover:bg-accent-purple/10
                ${layout === 'vertical' ? 'w-10 h-10' : 'w-8 h-8'}
              `}
              title="Yeni Gizli Sekme"
            >
              <UserX size={layout === 'vertical' ? 18 : 14} />
            </motion.button>
          )}

          {onReopenTab && (
            <RecentlyClosedMenu onReopen={onReopenTab}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={` 
                  rounded-xl flex items-center justify-center text-gray-400 transition-colors
                  hover:text-white hover:bg-white/10
                  ${layout === 'vertical' ? 'w-10 h-10' : 'w-8 h-8'}
                `}
                title="Son Kapatılanlar"
              >
                <RotateCcw size={layout === 'vertical' ? 18 : 14} />
              </motion.button>
            </RecentlyClosedMenu>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabBar;
