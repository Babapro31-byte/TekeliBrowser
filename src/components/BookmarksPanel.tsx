import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, Star, Folder, ExternalLink } from 'lucide-react';
import type { BookmarkEntry } from '../types/electron';

interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

const BookmarksPanel = ({ isOpen, onClose, onNavigate }: BookmarksPanelProps) => {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBookmarks = useCallback(async (search?: string) => {
    if (!window.electron?.getBookmarks) return;
    setLoading(true);
    try {
      const result = await window.electron.getBookmarks({
        search: search || undefined,
        limit: 200
      });
      setBookmarks(result || []);
    } catch (err) {
      console.error('[BookmarksPanel] Load failed:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadBookmarks(searchQuery);
    }
  }, [isOpen, loadBookmarks, searchQuery]);

  useEffect(() => {
    const onChanged = () => loadBookmarks(searchQuery);
    window.addEventListener('bookmarks-changed', onChanged as any);
    return () => window.removeEventListener('bookmarks-changed', onChanged as any);
  }, [loadBookmarks, searchQuery]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleDelete = useCallback(async (url: string) => {
    if (!window.electron?.removeBookmark) return;
    await window.electron.removeBookmark(url);
    setBookmarks(prev => prev.filter(b => b.url !== url));
  }, []);

  const handleNavigate = useCallback((url: string) => {
    onNavigate(url);
    onClose();
  }, [onNavigate, onClose]);

  const groupedBookmarks = bookmarks.reduce((acc, bookmark) => {
    const folder = 'All Bookmarks';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(bookmark);
    return acc;
  }, {} as Record<string, BookmarkEntry[]>);

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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xl h-[80vh] z-60 flex flex-col shadow-2xl rounded-2xl glass-panel"
          >
            <div className="flex items-center justify-between p-6 border-b border-outline/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-container/20 text-primary">
                  <Star size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-on-surface">Yer Imleri</h2>
                  <p className="text-xs text-outline">
                    {bookmarks.length} kayitli
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 px-4 h-12 rounded-xl border transition-colors bg-surface-container-low border-outline/10 focus-within:border-primary/50">
                <Search size={16} className="text-outline" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Yer imlerinde ara..."
                  className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder-outline"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="text-center py-12 text-outline">
                  Yukleniyor...
                </div>
              ) : bookmarks.length === 0 ? (
                <div className="text-center py-12 text-outline">
                  {searchQuery ? 'Sonuc bulunamadi' : 'Henuz yer imi eklenmedi'}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedBookmarks).map(([folder, items]) => (
                    <div key={folder}>
                      <div className="flex items-center gap-2 px-2 mb-2 text-outline">
                        <Folder size={14} />
                        <h3 className="text-xs font-semibold uppercase tracking-wider">{folder}</h3>
                        <span className="text-xs">({items.length})</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((bookmark) => {
                          let domain = '';
                          try { domain = new URL(bookmark.url).hostname; } catch {}
                          
                          return (
                            <motion.div
                              key={bookmark.id}
                              layout
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="group relative flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-surface-container-high border border-transparent hover:border-outline/10"
                            >
                              <img 
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} 
                                alt="" 
                                className="w-8 h-8 rounded-lg flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleNavigate(bookmark.url)}
                              >
                                <p className="text-sm font-medium truncate text-on-surface group-hover:text-primary">
                                  {bookmark.title || bookmark.url}
                                </p>
                                <p className="text-xs truncate text-outline">
                                  {domain}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(bookmark.url, '_blank');
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 text-gray-400 hover:text-white"
                                  title="Yeni pencerede ac"
                                >
                                  <ExternalLink size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(bookmark.url);
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-error/10 text-gray-400 hover:text-error"
                                  title="Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookmarksPanel;