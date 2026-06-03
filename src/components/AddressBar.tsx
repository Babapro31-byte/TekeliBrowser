import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import type { OmniboxSuggestion, SearchEngine, SearchHistoryEntry } from '../types/electron';
import { isSearchQueryInput, resolveOmniboxInput } from '../utils/omnibox';

interface AddressBarProps {
  currentUrl: string;
  currentTitle?: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome?: () => void;
  onToggleSplitView?: () => void;
  splitViewActive?: boolean;
  onOpenPrivacySettings?: () => void;
  onOpenDownloads?: () => void;
  onToggleAISidebar?: () => void;
  aiSidebarActive?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const isInternalUrl = (url: string) => url.startsWith('tekeli://');

const getDisplayUrl = (url: string) => {
  if (isInternalUrl(url)) return '';
  return url;
};

const normalizeAddressInput = (value: string) => value.trim();

const AddressBar = ({
  currentUrl,
  currentTitle,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onOpenPrivacySettings,
  onOpenDownloads,
  onToggleAISidebar,
  inputRef
}: AddressBarProps) => {
  type SuggestionItem =
    | (OmniboxSuggestion & { kind: 'history' | 'bookmark' })
    | { kind: 'query'; query: string; title: string; url: string };

  const [inputValue, setInputValue] = useState(getDisplayUrl(currentUrl));
  const [isFocused, setIsFocused] = useState(false);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const omniboxRef = useRef<HTMLDivElement>(null);
  const [suggestPosition, setSuggestPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMouseOverSuggestions, setIsMouseOverSuggestions] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(getDisplayUrl(currentUrl));
    }
  }, [currentUrl, isFocused]);

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

  const navigateTo = (url: string) => {
    setShowSuggestions(false);
    onNavigate(url);
  };

  const submitInput = async (raw: string) => {
    const trimmed = normalizeAddressInput(raw);
    const url = resolveOmniboxInput(trimmed, searchEngine);
    if (!url) return;
    if (isSearchQueryInput(trimmed)) {
      try {
        await window.electron?.addSearchQuery?.(trimmed);
      } catch {}
    }
    navigateTo(url);
  };

  useEffect(() => {
    if (!isFocused || inputValue.trim().length < 1) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    let mounted = true;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const fetchSuggestions = async () => {
      if (!window.electron?.getOmniboxSuggestions) return;
      try {
        const [results, searches] = await Promise.all([
          window.electron.getOmniboxSuggestions(inputValue, 6),
          window.electron.getSearchHistory?.(inputValue, 6) || Promise.resolve([] as SearchHistoryEntry[])
        ]);

        if (!mounted || !inputValue.trim()) return;

        const mappedSearches: SuggestionItem[] = (searches || []).map((q) => ({
          kind: 'query',
          query: q.query,
          title: q.query,
          url: resolveOmniboxInput(q.query, searchEngine)
        }));

        const merged = [...mappedSearches, ...(results || [])].slice(0, 8);

        if (!mounted || !inputValue.trim()) return;

        if (merged.length > 0) {
          setSuggestions(merged);
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to get suggestions:', err);
        }
      }
    };

    debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
    };
  }, [inputValue, isFocused, searchEngine]);

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
        const selected = suggestions[selectedSuggestion];
        if (selected.kind === 'query') {
          setInputValue(selected.query);
          submitInput(selected.query);
        } else {
          navigateTo(selected.url);
        }
        (e.target as HTMLInputElement).blur();
        return;
      }

      submitInput(inputValue);
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

  const addressIcon = currentUrl === 'tekeli://newtab'
    ? 'shield'
    : currentUrl.startsWith('https://')
      ? 'lock'
      : currentUrl.startsWith('http://')
        ? 'warning'
        : 'language';

  return (
    <div className="flex flex-col gap-2 px-4 py-1.5 bg-surface-container-low border-b border-outline/10">
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="flex items-center gap-1 text-secondary shrink-0">
          <button
            onClick={onBack}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="Geri"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          </button>
          <button
            onClick={onForward}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="İleri"
            aria-label="İleri"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </button>
          <button
            onClick={onReload}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="Yenile"
            aria-label="Yenile"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
          </button>
          <button
            onClick={onHome}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="Başlangıç"
            aria-label="Başlangıç sayfası"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">home</span>
          </button>
        </div>
        <div
          ref={omniboxRef}
          className="flex-1 min-w-0 flex items-center px-3 h-8 bg-surface-container-highest rounded-lg border border-transparent focus-within:border-outline-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] text-secondary mr-2 flex-shrink-0" aria-hidden="true">
            {addressIcon}
          </span>
          <input
            type="text"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (isMouseOverSuggestions) return;
              setTimeout(() => {
                if (!isMouseOverSuggestions) {
                  setIsFocused(false);
                  setShowSuggestions(false);
                  setSelectedSuggestion(-1);
                  setInputValue(getDisplayUrl(currentUrl));
                }
              }, 250);
            }}
            placeholder="Search with DuckDuckGo or enter address"
            className="text-xs text-primary flex-1 min-w-0 bg-transparent outline-none w-full truncate placeholder:text-on-surface-variant"
            role="combobox"
            aria-label="Adres ve arama çubuğu"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="omnibox-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={selectedSuggestion >= 0 ? `omnibox-suggestion-${selectedSuggestion}` : undefined}
          />
          <button
            onClick={handleToggleBookmark}
            className="text-secondary text-[16px] ml-2 hover:text-primary transition-colors shrink-0"
            title="Yer imi"
            aria-label={isBookmarked ? 'Yer imini kaldır' : 'Yer imi ekle'}
            aria-pressed={isBookmarked}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{isBookmarked ? 'star' : 'star_border'}</span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-secondary shrink-0">
          <button
            onClick={onOpenPrivacySettings}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="Gizlilik Ayarları"
            aria-label="Gizlilik Ayarları"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
          </button>
          <button
            onClick={onOpenDownloads}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="İndirmeler"
            aria-label="İndirmeler"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
          </button>
          <button
            onClick={onToggleAISidebar}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-colors"
            title="Menü"
            aria-label="Menü"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">menu</span>
          </button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="omnibox-suggestions"
          role="listbox"
          aria-label="Adres önerileri"
          className="fixed overflow-hidden rounded-xl bg-surface-container-highest border border-outline/15 shadow-elev-3 max-w-3xl mx-auto w-full"
          style={{
            top: suggestPosition.top,
            left: suggestPosition.left,
            width: suggestPosition.width,
            zIndex: 80,
          }}
          onMouseEnter={() => setIsMouseOverSuggestions(true)}
          onMouseLeave={() => setIsMouseOverSuggestions(false)}
        >
          <div className="p-2 space-y-1">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.kind}:${s.kind === 'query' ? s.query : s.url}`}
                id={`omnibox-suggestion-${idx}`}
                role="option"
                aria-selected={idx === selectedSuggestion}
                onMouseEnter={() => setSelectedSuggestion(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (s.kind === 'query') {
                    setInputValue(s.query);
                    submitInput(s.query);
                  } else {
                    navigateTo(s.url);
                  }
                }}
                className={`w-full px-3 py-2 rounded-md flex items-center gap-3 text-left text-sm transition-colors group
                  ${idx === selectedSuggestion ? 'bg-primary-container/20 text-primary' : 'text-secondary hover:bg-surface-container-high hover:text-primary'}`}
              >
                <span className={`material-symbols-outlined text-[15px] ${idx === selectedSuggestion ? 'text-primary' : 'text-secondary'}`} aria-hidden="true">
                  search
                </span>
                <span className="flex-1 truncate">{s.title || s.url}</span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                  {s.kind === 'bookmark' ? 'Bookmark' : s.kind === 'history' ? 'History' : 'Search'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressBar;
