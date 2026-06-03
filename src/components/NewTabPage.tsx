import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, Clock3, Search, Settings } from 'lucide-react';
import type { ClosedTab, SearchEngine } from '../types/electron';
import { isSearchQueryInput, resolveOmniboxInput } from '../utils/omnibox';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

const NewTabPage = ({ onNavigate }: NewTabPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentlyClosed, setRecentlyClosed] = useState<ClosedTab[]>([]);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!window.electron?.getRecentlyClosed) return;
        const tabs = await window.electron.getRecentlyClosed();
        if (mounted && tabs) setRecentlyClosed(tabs.slice(0, 4));
      } catch {}

      try {
        if (!window.electron?.getSearchEngine) return;
        const res = await window.electron.getSearchEngine();
        if (mounted && res?.engine) setSearchEngine(res.engine as SearchEngine);
      } catch {}
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    const url = resolveOmniboxInput(query, searchEngine);
    if (url) {
      if (isSearchQueryInput(query)) {
        window.electron?.addSearchQuery?.(query).catch(() => {});
      }
      onNavigate(url);
    }
  }, [searchQuery, onNavigate, searchEngine]);

  const fireUiAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('tekeli-ui-action', { detail: { action } }));
  };

  const quickActions = [
    { label: 'Bookmarks', meta: 'Library', icon: Bookmark, action: () => fireUiAction('open-bookmarks') },
    { label: 'History', meta: 'Sessions', icon: Clock3, action: () => fireUiAction('open-history') },
    { label: 'Settings', meta: 'Preferences', icon: Settings, action: () => fireUiAction('open-settings') },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-background text-on-surface">
      <div className="min-h-full flex items-center justify-center px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[760px] flex flex-col items-center"
        >
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="w-14 h-14 bg-surface-container-highest flex items-center justify-center rounded-xl border border-outline/15 shadow-elev-2">
              <img src="/logo.svg" alt="Tekeli logosu" className="w-9 h-9 object-contain grayscale invert brightness-200" />
            </div>
            <h1 className="text-[2.15rem] font-black tracking-[-0.08em] text-primary">TEKELI</h1>
            <p className="text-[11px] uppercase tracking-[0.35em] text-secondary font-medium">
              Private Navigation Terminal
            </p>
          </div>

          <form onSubmit={handleSearch} className="w-full">
            <div
              className={`w-full h-14 bg-surface-container-high border border-transparent rounded-xl shadow-elev-3 transition-colors ${
                isFocused ? 'border-outline-variant' : ''
              }`}
            >
              <div className="h-full flex items-center gap-3 px-4">
                <Search size={18} className="text-secondary flex-shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={`Search with ${searchEngine === 'duckduckgo' ? 'DuckDuckGo' : 'Google'} or enter address`}
                  className="flex-1 h-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
                  aria-label="Ara veya adres gir"
                  autoFocus
                />
                <button
                  type="submit"
                  className="h-8 w-8 rounded-md flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-highest transition-colors"
                  title="Ara"
                  aria-label="Ara"
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>

          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {quickActions.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="group bg-surface-container-low hover:bg-surface-container-highest transition-colors p-4 flex flex-col gap-3 text-left rounded-xl min-h-[116px]"
              >
                <div className="w-10 h-10 bg-surface-container-highest group-hover:bg-primary-container flex items-center justify-center transition-colors rounded-md">
                  <item.icon size={18} className="text-primary group-hover:text-on-primary-container" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{item.label}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.24em] mt-1">{item.meta}</p>
                </div>
              </button>
            ))}
          </div>

          {recentlyClosed.length > 0 && (
            <div className="w-full mt-8 bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-secondary mb-2">Recently Closed</p>
              <div className="space-y-1">
                {recentlyClosed.map((tab, index) => {
                  let hostname = tab.url;
                  try {
                    hostname = new URL(tab.url).hostname;
                  } catch {}

                  return (
                    <button
                      key={`${tab.closedAt}-${index}`}
                      onClick={() => onNavigate(tab.url)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden="true">history</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-on-surface truncate">{tab.title}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{hostname}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NewTabPage;
