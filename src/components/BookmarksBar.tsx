import { memo, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
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
    return null;
  }

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 text-[11px] font-medium tracking-wide text-outline uppercase font-label overflow-x-auto whitespace-nowrap border-b border-outline/10 bg-surface-container-low">
      {bookmarks.map((b) => (
        <button
          key={b.id}
          onClick={() => onNavigate(b.url)}
          className="flex items-center gap-1.5 hover:text-primary transition-colors shrink-0"
        >
          <Star size={14} fill="currentColor" />
          <span className="max-w-[180px] truncate">{b.title || b.url}</span>
        </button>
      ))}
    </div>
  );
});

BookmarksBar.displayName = 'BookmarksBar';
export default BookmarksBar;
