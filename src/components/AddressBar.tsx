import { useState, KeyboardEvent, useEffect, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Download, Bookmark, ArrowLeft, ArrowRight, RotateCw, Search } from 'lucide-react';
import type { OmniboxSuggestion, SearchEngine } from '../types/electron';
import { resolveOmniboxInput } from '../utils/omnibox';
import type { ThemeDef } from '../utils/themes';

interface AddressBarProps {
  currentUrl: string;
  currentTitle?: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onToggleSplitView: () => void;
  splitViewActive: boolean;
  onOpenPrivacySettings?: () => void;
  onOpenDownloads?: () => void;
  inputRef?: RefObject<HTMLInputElement>;
  activeTheme?: ThemeDef;
}

// Check if URL is an internal URL
const isInternalUrl = (url: string) => url.startsWith('tekeli://');

// Get display value for URL (hide internal URLs)
const getDisplayUrl = (url: string) => {
  if (isInternalUrl(url)) return '';
  return url;
};

const AddressBar = ({
  currentUrl,
  currentTitle,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onToggleSplitView,
  splitViewActive,
  onOpenPrivacySettings,
  onOpenDownloads,
  inputRef,
  activeTheme
}: AddressBarProps) => {
  const [inputValue, setInputValue] = useState(getDisplayUrl(currentUrl));
  const [isFocused, setIsFocused] = useState(false);
  const [blockedAds, setBlockedAds] = useState(0);
  const [showShieldPopup, setShowShieldPopup] = useState(false);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [suggestions, setSuggestions] = useState<OmniboxSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const shieldButtonRef = useRef<HTMLButtonElement>(null);
  const omniboxRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [suggestPosition, setSuggestPosition] = useState({ top: 0, left: 0, width: 0 });

  // Update popup position when opening
  const handleShieldClick = () => {
    if (!showShieldPopup && shieldButtonRef.current) {
      const rect = shieldButtonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setShowShieldPopup(!showShieldPopup);
  };

  // Close popup when clicking outside
  useEffect(() => {
    if (!showShieldPopup) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.shield-popup') && !target.closest('.shield-button')) {
        setShowShieldPopup(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showShieldPopup]);

  // Sync input with currentUrl when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(getDisplayUrl(currentUrl));
    }
  }, [currentUrl, isFocused]);

  // Fetch ad block stats (less frequently for performance)
  useEffect(() => {
    let mounted = true;
    
    const fetchStats = async () => {
      if (!window.electron?.getAdBlockStats) return;
      try {
        const stats = await window.electron.getAdBlockStats();
        if (mounted && stats) {
          setBlockedAds(stats.session);
        }
      } catch (err) {
        // Silently ignore errors to avoid console spam
      }
    };

    // Initial fetch
    fetchStats();

    // Check stats every 5 seconds instead of every second
    const interval = setInterval(fetchStats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch preferences
  useEffect(() => {
    let mounted = true;
    const fetchPrefs = async () => {
      try {
        if (!window.electron?.getSearchEngine) return;
        const res = await window.electron.getSearchEngine();
        if (mounted && res?.engine) setSearchEngine(res.engine as SearchEngine);
      } catch (err) {
        console.error('Failed to fetch search engine:', err);
      }
    };
    fetchPrefs();
    return () => { mounted = false; };
  }, []);

  // Check if current URL is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!window.electron?.getBookmarks) return;
      try {
        const bookmarks = await window.electron.getBookmarks();
        setIsBookmarked(bookmarks.some((b: any) => b.url === currentUrl));
      } catch (err) {
        console.error('Failed to check bookmark:', err);
      }
    };
    
    checkBookmark();
    
    const handleBookmarksChanged = () => checkBookmark();
    window.addEventListener('bookmarks-changed', handleBookmarksChanged);
    return () => window.removeEventListener('bookmarks-changed', handleBookmarksChanged);
  }, [currentUrl]);

  // Handle omnibox suggestions
  useEffect(() => {
    if (!isFocused || inputValue.length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      if (!window.electron?.getOmniboxSuggestions) return;
      try {
        const results = await window.electron.getOmniboxSuggestions(inputValue);
        if (results && results.length > 0) {
          setSuggestions(results);
          setShowSuggestions(true);
          
          if (omniboxRef.current) {
            const rect = omniboxRef.current.getBoundingClientRect();
            setSuggestPosition({
              top: rect.bottom + 8,
              left: rect.left,
              width: rect.width
            });
          }
        } else {
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Failed to get suggestions:', err);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounce);
  }, [inputValue, isFocused]);

  const navigateTo = (url: string) => {
    setShowSuggestions(false);
    onNavigate(url);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.max(prev - 1, -1));
        return;
      }
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
      return;
    }

    if (e.key === 'Enter') {
      if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
        e.preventDefault();
        navigateTo(suggestions[selectedSuggestion].url);
        (e.target as HTMLInputElement).blur();
        return;
      }

      const url = resolveOmniboxInput(inputValue, searchEngine);
      if (!url) return;

      navigateTo(url);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleToggleBookmark = async () => {
    const url = getDisplayUrl(currentUrl);
    if (!url) return;
    try {
      if (isBookmarked) {
        await window.electron?.removeBookmark?.(url);
        setIsBookmarked(false);
      } else {
        await window.electron?.addBookmark?.(url, currentTitle || url);
        setIsBookmarked(true);
      }
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    } catch {}
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isFocused ? '100%' : '600px',
        y: isFocused ? 0 : 0
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative h-12 flex items-center px-2 rounded-full backdrop-blur-md shadow-glass z-50 overflow-visible
        ${activeTheme ? activeTheme.panel : 'bg-bg-tertiary/70 border-white/10 border'}
        ${isFocused ? 'ring-2 ring-accent-blue/50 shadow-glass-glow' : 'hover:shadow-glass-active hover:scale-[1.01] transition-transform'}`}
    >
      {/* Navigation Buttons (Fade out on focus) */}
      <AnimatePresence>
        {!isFocused && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1 mr-2 overflow-hidden flex-shrink-0"
          >
            <NavButton onClick={onBack} title="Back">
              <ArrowLeft size={16} />
            </NavButton>
            <NavButton onClick={onForward} title="Forward">
              <ArrowRight size={16} />
            </NavButton>
            <NavButton onClick={onReload} title="Reload">
              <RotateCw size={16} />
            </NavButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <div 
        ref={omniboxRef}
        className="flex-1 flex items-center h-full gap-2 px-3 relative"
      >
        <Search size={16} className={`flex-shrink-0 ${isFocused ? 'text-accent-blue' : 'text-gray-400'}`} />
        
        <input
          type="text"
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
              setSuggestions([]);
              setSelectedSuggestion(-1);
              setInputValue(getDisplayUrl(currentUrl));
            }, 120);
          }}
          placeholder="Search or enter address..."
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none w-full"
        />

        {/* Feature Buttons (Fade out on focus) */}
        <AnimatePresence>
          {!isFocused && (
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 overflow-hidden flex-shrink-0 ml-2"
            >
              <FeatureButton onClick={handleToggleBookmark} active={isBookmarked} title="Bookmark">
                <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              </FeatureButton>

              <button
                ref={shieldButtonRef}
                onClick={handleShieldClick}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors relative
                  ${blockedAds > 0 ? 'text-accent-green hover:bg-accent-green/20' : 'text-gray-400 hover:bg-white/10'}`}
              >
                <Shield size={16} />
                {blockedAds > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-green text-bg-primary text-[9px] font-bold flex items-center justify-center">
                    {blockedAds > 99 ? '99+' : blockedAds}
                  </span>
                )}
              </button>

              {onOpenDownloads && (
                <FeatureButton onClick={onOpenDownloads} title="Downloads">
                  <Download size={16} />
                </FeatureButton>
              )}
              {onOpenPrivacySettings && (
                <FeatureButton onClick={onOpenPrivacySettings} title="Settings">
                  <Settings size={16} />
                </FeatureButton>
              )}
              <FeatureButton onClick={onToggleSplitView} title="Split View" active={splitViewActive}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
              </FeatureButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions Dropdown */}
      {createPortal(
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15, type: 'spring', bounce: 0.4 }}
              className="fixed rounded-2xl overflow-hidden bg-bg-secondary/95 backdrop-blur-xl border border-white/10 shadow-glass-glow"
              style={{
                top: suggestPosition.top,
                left: suggestPosition.left,
                width: suggestPosition.width,
                zIndex: 99998,
              }}
            >
              <div className="p-2 space-y-1">
                {suggestions.map((s, idx) => (
                  <button
                    key={`${s.kind}:${s.url}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigateTo(s.url);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-left text-sm transition-colors group
                      ${idx === selectedSuggestion ? 'bg-accent-blue/20 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Search size={14} className={idx === selectedSuggestion ? 'text-accent-blue' : 'text-gray-500 group-hover:text-gray-400'} />
                    <span className="flex-1 truncate">{s.title || s.url}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">
                      {s.kind === 'bookmark' ? 'Bookmark' : 'History'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Shield Popup */}
      {createPortal(
        <AnimatePresence>
          {showShieldPopup && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="shield-popup fixed w-72 rounded-2xl p-4 bg-bg-secondary/95 backdrop-blur-xl border border-white/10 shadow-glass-glow"
              style={{
                top: popupPosition.top,
                left: popupPosition.left - 240, // Offset to right-align roughly
                zIndex: 99999,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-green/20 text-accent-green flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Shield Active</h3>
                  <p className="text-xs text-accent-green">Blocking trackers</p>
                </div>
              </div>

              <div className="rounded-xl p-3 bg-white/5 border border-white/5 flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Blocked Ads</span>
                <span className="font-bold text-lg text-accent-green">{blockedAds}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

const NavButton = ({ onClick, children, title }: { onClick: () => void, children: React.ReactNode, title: string }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
  >
    {children}
  </button>
);

const FeatureButton = ({ onClick, children, title, active = false }: { onClick: () => void, children: React.ReactNode, title: string, active?: boolean }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
      ${active ? 'text-accent-blue bg-accent-blue/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
  >
    {children}
  </button>
);

export default AddressBar;
