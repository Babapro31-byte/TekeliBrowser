import { memo } from 'react';

interface BookmarksBarProps {
  onNavigate: (url: string) => void;
}

const bookmarks = [
  { name: 'YouTube', url: 'https://www.youtube.com', color: 'hover:text-red-500', bg: 'hover:bg-red-500/10' },
  { name: 'GitHub', url: 'https://www.github.com', color: 'hover:text-white', bg: 'hover:bg-white/10' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'hover:text-emerald-400', bg: 'hover:bg-emerald-500/10' },
  { name: 'Google', url: 'https://www.google.com', color: 'hover:text-blue-400', bg: 'hover:bg-blue-500/10' },
  { name: 'Twitter', url: 'https://twitter.com', color: 'hover:text-sky-400', bg: 'hover:bg-sky-500/10' },
];

const BookmarksBar = memo(({ onNavigate }: BookmarksBarProps) => {
  return (
    <div className="h-9 bg-dark-surface/40 border-b border-neon-blue/10 flex items-center px-4 space-x-2">
      {bookmarks.map((b) => (
        <button
          key={b.name}
          onClick={() => onNavigate(b.url)}
          className={`px-3 py-1 rounded-md text-xs text-white/60 ${b.color} ${b.bg} transition-colors`}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
});

BookmarksBar.displayName = 'BookmarksBar';
export default BookmarksBar;
