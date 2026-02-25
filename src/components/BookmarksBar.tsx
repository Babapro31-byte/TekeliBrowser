import { memo, useEffect, useState } from 'react';
import type { BookmarkEntry } from '../types/electron';
import type { ThemeDef, ThemeId } from '../utils/themes';

interface BookmarksBarProps {
  onNavigate: (url: string) => void;
  activeTheme?: ThemeDef;
  activeThemeId?: ThemeId;
}

const BookmarksBar = memo(({ onNavigate, activeThemeId }: BookmarksBarProps) => {
  const isLight = activeThemeId === 'light';
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!window.electron?.getBookmarks) return;
        const list = await window.electron.getBookmarks({ limit: 12 });
        if (mounted) setBookmarks(list || []);
      } catch {
        if (mounted) setBookmarks([]);
      }
    };
    const onChanged = () => load();
    load();
    window.addEventListener('bookmarks-changed', onChanged as any);
    return () => {
      mounted = false;
      window.removeEventListener('bookmarks-changed', onChanged as any);
    };
  }, []);

  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <div className={`h-10 flex items-center px-4 gap-2 bg-transparent z-40 relative`}>
      {bookmarks.map((b) => {
        let domain = '';
        try { domain = new URL(b.url).hostname; } catch {}
        
        return (
          <button
            key={b.id}
            onClick={() => onNavigate(b.url)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors backdrop-blur-md border ${
              isLight 
                ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm' 
                : 'bg-bg-secondary/60 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white shadow-glass hover:border-white/10'
            }`}
          >
            <img 
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} 
              alt="" 
              className="w-3.5 h-3.5 rounded-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="truncate max-w-[120px]">{b.title || b.url}</span>
          </button>
        );
      })}
    </div>
  );
});

BookmarksBar.displayName = 'BookmarksBar';
export default BookmarksBar;
