import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClosedTab } from '../types/electron';

interface RecentlyClosedMenuProps {
  onReopen: (url: string, title: string) => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Az once';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk once`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat once`;
  return `${Math.floor(hours / 24)} gun once`;
}

const RecentlyClosedMenu = ({ onReopen }: RecentlyClosedMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [closedTabs, setClosedTabs] = useState<ClosedTab[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load recently closed when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    
    const load = async () => {
      if (!window.electron?.getRecentlyClosed) return;
      try {
        const tabs = await window.electron.getRecentlyClosed();
        setClosedTabs(tabs || []);
      } catch {
        setClosedTabs([]);
      }
    };
    load();
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg bg-dark-surface/50 hover:bg-dark-hover/50 border border-transparent hover:border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-all flex-shrink-0"
        title="Son kapatilan sekmeler"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-72 py-1 rounded-xl bg-dark-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 z-50"
          >
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-xs font-medium text-white/50">Son Kapatilan Sekmeler</span>
            </div>
            
            {closedTabs.length === 0 ? (
              <div className="px-4 py-6 text-center text-white/30 text-xs">
                Kapatilan sekme yok
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {closedTabs.map((tab, i) => (
                  <button
                    key={`${tab.url}-${tab.closedAt}-${i}`}
                    onClick={() => {
                      onReopen(tab.url, tab.title);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 hover:bg-white/5 flex items-start gap-2.5 text-left transition-colors"
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[8px] text-white/60 font-bold uppercase">
                        {getDomain(tab.url).charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">{tab.title}</p>
                      <p className="text-[10px] text-white/30 truncate">{getDomain(tab.url)}</p>
                    </div>
                    <span className="text-[10px] text-white/20 flex-shrink-0 mt-0.5">
                      {timeAgo(tab.closedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecentlyClosedMenu;
