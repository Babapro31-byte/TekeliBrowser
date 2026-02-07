import { memo, useEffect, useState } from 'react';
import type { BookmarkEntry } from '../types/electron';

interface BookmarksBarProps {
  onNavigate: (url: string) => void;
}

const BookmarksBar = memo(({ onNavigate }: BookmarksBarProps) => {
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
    return <div className="h-9 bg-dark-surface/40 border-b border-neon-blue/10" />;
  }

  return (
    <div className="h-9 bg-dark-surface/40 border-b border-neon-blue/10 flex items-center px-4 space-x-2">
      {bookmarks.map((b) => (
        <button
          key={b.id}
          onClick={() => onNavigate(b.url)}
          className="px-3 py-1 rounded-md text-xs text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 transition-colors"
        >
          {b.title || b.url}
        </button>
      ))}
    </div>
  );
});

BookmarksBar.displayName = 'BookmarksBar';
export default BookmarksBar;
