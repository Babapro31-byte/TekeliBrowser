import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryEntry } from '../types/electron';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

// Group history by date
function groupByDate(entries: HistoryEntry[]): { label: string; entries: HistoryEntry[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const thisWeek = today - 7 * 86400000;

  const groups: { [key: string]: HistoryEntry[] } = {
    'Bugun': [],
    'Dun': [],
    'Bu Hafta': [],
    'Daha Eski': []
  };

  for (const entry of entries) {
    if (entry.timestamp >= today) {
      groups['Bugun'].push(entry);
    } else if (entry.timestamp >= yesterday) {
      groups['Dun'].push(entry);
    } else if (entry.timestamp >= thisWeek) {
      groups['Bu Hafta'].push(entry);
    } else {
      groups['Daha Eski'].push(entry);
    }
  }

  return Object.entries(groups)
    .filter(([, entries]) => entries.length > 0)
    .map(([label, entries]) => ({ label, entries }));
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const HistoryPanel = ({ isOpen, onClose, onNavigate }: HistoryPanelProps) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async (search?: string) => {
    if (!window.electron?.getHistory) return;
    setLoading(true);
    try {
      const result = await window.electron.getHistory({
        search: search || undefined,
        limit: 200
      });
      setEntries(result || []);
    } catch (err) {
      console.error('[HistoryPanel] Load failed:', err);
    }
    setLoading(false);
  }, []);

  // Load when opened
  useEffect(() => {
    if (isOpen) {
      loadHistory(searchQuery);
    }
  }, [isOpen, loadHistory, searchQuery]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleDelete = useCallback(async (url: string) => {
    if (!window.electron?.deleteHistoryEntry) return;
    await window.electron.deleteHistoryEntry(url);
    setEntries(prev => prev.filter(e => e.url !== url));
  }, []);

  const handleClearAll = useCallback(async () => {
    if (!window.electron?.clearHistory) return;
    await window.electron.clearHistory();
    setEntries([]);
  }, []);

  const handleNavigate = useCallback((url: string) => {
    onNavigate(url);
    onClose();
  }, [onNavigate, onClose]);

  const grouped = groupByDate(entries);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 350, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-80 h-full glass border-l border-cyan-500/20 flex flex-col absolute right-0 top-0 z-30"
        >
          {/* Header */}
          <div className="h-14 border-b border-cyan-500/20 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="text-white/90 font-semibold text-sm">Gecmis</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1L13 13M13 1L1 13" />
              </svg>
            </motion.button>
          </div>
          
          {/* Search */}
          <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Gecmiste ara..."
                className="w-full pl-9 pr-3 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-white text-xs placeholder-white/30 outline-none focus:border-cyan-500/40 transition-colors"
              />
            </div>
          </div>
          
          {/* History List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm">Gecmis bos</p>
              </div>
            ) : (
              <div className="py-1">
                {grouped.map(group => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.entries.map((entry, i) => (
                      <motion.div
                        key={`${entry.url}-${entry.timestamp}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group px-3 py-1.5 hover:bg-white/5 cursor-pointer flex items-start gap-2.5 relative"
                        onClick={() => handleNavigate(entry.url)}
                      >
                        {/* Favicon placeholder */}
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[8px] text-white/60 font-bold uppercase">
                            {getDomain(entry.url).charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 truncate">{entry.title}</p>
                          <p className="text-[10px] text-white/30 truncate">{getDomain(entry.url)}</p>
                        </div>
                        
                        <span className="text-[10px] text-white/20 flex-shrink-0 mt-0.5">
                          {formatTime(entry.timestamp)}
                        </span>
                        
                        {/* Delete button on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.url);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer - Clear All */}
          {entries.length > 0 && (
            <div className="px-3 py-2 border-t border-white/5 flex-shrink-0">
              <button
                onClick={handleClearAll}
                className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
              >
                Tum Gecmisi Temizle
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
