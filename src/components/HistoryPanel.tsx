import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryEntry } from '../types/electron';
import type { ThemeDef, ThemeId } from '../utils/themes';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  activeTheme?: ThemeDef;
  activeThemeId?: ThemeId;
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

const HistoryPanel = ({ isOpen, onClose, onNavigate, activeTheme: _activeTheme, activeThemeId }: HistoryPanelProps) => {
  const isLight = activeThemeId === 'light';
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
          className={`w-80 h-full flex flex-col absolute right-0 top-0 z-30 ${isLight ? 'bg-slate-50' : 'bg-bg-primary'}`}
        >
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-100 text-blue-500' : 'bg-accent-blue/20 text-accent-blue'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>Geçmiş</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-gray-400'}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1L13 13M13 1L1 13" />
              </svg>
            </motion.button>
          </div>

          <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">
            {/* Search - Floating Island */}
            <div className={`p-1 mb-3 rounded-xl backdrop-blur-xl border flex-shrink-0 ${isLight ? 'bg-white/80 border-slate-200' : 'bg-bg-secondary/80 border-white/5 shadow-glass'}`}>
              <div className="relative">
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Geçmişte ara..."
                  className={`w-full pl-9 pr-3 py-2 bg-transparent text-sm outline-none transition-colors ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-gray-500'}`}
                />
              </div>
            </div>

            {/* History List */}
            <div className={`flex-1 overflow-y-auto rounded-2xl border p-2 scrollbar-hide ${isLight ? 'bg-white border-slate-200' : 'bg-bg-secondary/50 border-white/5'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-8 h-full">
                  <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-12 h-full ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-sm">Geçmiş boş</p>
                </div>
              ) : (
                <div className="py-1 space-y-4">
                  {grouped.map(group => (
                    <div key={group.label}>
                      <div className={`px-2 pb-2 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                        {group.label}
                      </div>
                      <div className="space-y-1">
                        {group.entries.map((entry, i) => (
                          <motion.div
                            key={`${entry.url}-${entry.timestamp}-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`group px-3 py-2 cursor-pointer flex items-center gap-3 relative rounded-xl transition-all ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                            onClick={() => handleNavigate(entry.url)}
                          >
                            {/* Favicon placeholder */}
                            <div className={`w-6 h-6 rounded bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${isLight ? 'from-slate-100 to-slate-200' : 'from-accent-blue/20 to-accent-purple/20'}`}>
                              <span className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-accent-blue'}`}>
                                {getDomain(entry.url).charAt(0)}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                              <p className={`text-sm truncate ${isLight ? 'text-slate-700 group-hover:text-blue-600' : 'text-white/90 group-hover:text-white'}`}>{entry.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className={`text-[10px] truncate flex-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{getDomain(entry.url)}</p>
                                <span className={`text-[9px] flex-shrink-0 ${isLight ? 'text-slate-300' : 'text-white/20'}`}>
                                  {formatTime(entry.timestamp)}
                                </span>
                              </div>
                            </div>

                            {/* Delete button on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.url);
                              }}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${isLight ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
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

            {/* Footer - Clear All */}
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
                    className={`w-full py-2.5 rounded-xl text-xs font-medium transition-colors ${isLight ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10'}`}
                  >
                    Tüm Geçmişi Temizle
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
