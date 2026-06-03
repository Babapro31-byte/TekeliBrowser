import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryEntry } from '../types/electron';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

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
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg h-[75vh] flex flex-col z-50 rounded-2xl border shadow-2xl glass-panel"
        >
          <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-container/20 text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-on-surface">Gecmis</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1L13 13M13 1L1 13" />
              </svg>
            </motion.button>
          </div>

          <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">
            <div className="p-1 mb-3 rounded-xl backdrop-blur-xl border bg-surface-container-low/80 border-outline/5 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Gecmiste ara..."
                  className="w-full pl-9 pr-3 py-2 bg-transparent text-sm outline-none transition-colors text-on-surface placeholder-outline"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border p-2 scrollbar-hide bg-surface-container-low/50 border-outline/5">
              {loading ? (
                <div className="flex items-center justify-center py-8 h-full">
                  <div className="w-6 h-6 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 h-full text-outline">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high/20 flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-sm">Gecmis bos</p>
                </div>
              ) : (
                <div className="py-1 space-y-4">
                  {grouped.map(group => (
                    <div key={group.label}>
                      <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-outline">
                        {group.label}
                      </div>
                      <div className="space-y-1">
                        {group.entries.map((entry, i) => (
                          <motion.div
                            key={`${entry.url}-${entry.timestamp}-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group px-3 py-2 cursor-pointer flex items-center gap-3 relative rounded-xl transition-all hover:bg-surface-container-high"
                            onClick={() => handleNavigate(entry.url)}
                          >
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-container/20 to-secondary-container/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold uppercase text-primary">
                                {getDomain(entry.url).charAt(0)}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                              <p className="text-sm truncate text-on-surface group-hover:text-primary">{entry.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] truncate flex-1 text-outline">{getDomain(entry.url)}</p>
                                <span className="text-[9px] flex-shrink-0 text-outline/50">
                                  {formatTime(entry.timestamp)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.url);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-error/10 text-error hover:bg-error/20"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {entries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex-shrink-0"
                >
                  <button
                    onClick={handleClearAll}
                    className="w-full py-2.5 rounded-xl text-xs font-medium transition-colors bg-error/10 hover:bg-error/20 text-error border border-error/10"
                  >
                    Tum Gecmisi Temizle
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;