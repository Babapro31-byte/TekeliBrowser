import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Globe } from 'lucide-react';
import type { ClosedTab, SearchEngine } from '../types/electron';
import { resolveOmniboxInput } from '../utils/omnibox';
import type { ThemeDef, ThemeId } from '../utils/themes';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
  activeTheme?: ThemeDef;
  activeThemeId?: ThemeId;
}

interface QuickLink {
  id: string;
  name: string;
  url: string;
}

const STORAGE_KEY = 'tekeli-quick-links';

const DEFAULT_LINKS: QuickLink[] = [
  { id: '1', name: 'YouTube', url: 'https://youtube.com' },
  { id: '2', name: 'GitHub', url: 'https://github.com' },
  { id: '3', name: 'Twitter', url: 'https://twitter.com' },
];

const NewTabPage = ({ onNavigate, activeTheme: _activeTheme, activeThemeId }: NewTabPageProps) => {
  const isLight = activeThemeId === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [recentlyClosed, setRecentlyClosed] = useState<ClosedTab[]>([]);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Load quick links, recently closed tabs, and settings
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setQuickLinks(JSON.parse(saved));
      } catch {
        setQuickLinks(DEFAULT_LINKS);
      }
    } else {
      setQuickLinks(DEFAULT_LINKS);
    }

    let mounted = true;
    const load = async () => {
      try {
        if (!window.electron?.getRecentlyClosed) return;
        const tabs = await window.electron.getRecentlyClosed();
        if (mounted && tabs) setRecentlyClosed(tabs.slice(0, 5));
      } catch {}

      try {
        if (!window.electron?.getSearchEngine) return;
        const res = await window.electron.getSearchEngine();
        if (mounted && res?.engine) setSearchEngine(res.engine as SearchEngine);
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Save quick links to localStorage
  const saveLinks = useCallback((links: QuickLink[]) => {
    setQuickLinks(links);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const url = resolveOmniboxInput(searchQuery.trim(), searchEngine);
    if (url) onNavigate(url);
  }, [searchQuery, onNavigate, searchEngine]);

  const openAddModal = () => {
    setEditingLink(null);
    setNewLinkName('');
    setNewLinkUrl('');
    setIsAdding(true);
  };

  const openEditModal = (link: QuickLink) => {
    setEditingLink(link);
    setNewLinkName(link.name);
    setNewLinkUrl(link.url);
    setIsAdding(true);
  };

  const handleSaveLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;

    let finalUrl = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editingLink) {
      saveLinks(quickLinks.map(l => 
        l.id === editingLink.id ? { ...l, name: newLinkName, url: finalUrl } : l
      ));
    } else {
      saveLinks([
        ...quickLinks,
        { id: Date.now().toString(), name: newLinkName, url: finalUrl }
      ]);
    }
    setIsAdding(false);
  };

  const handleDeleteLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveLinks(quickLinks.filter(l => l.id !== id));
  };

  const getFaviconUrl = (url: string) => {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  // Close context menu on click anywhere
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleReloadPage = () => {
    setContextMenu(null);
    window.location.reload();
  };

  const handleAddQuickLinkFromMenu = () => {
    setContextMenu(null);
    openAddModal();
  };

  const handleViewSourceFromMenu = () => {
    setContextMenu(null);
    const href = window.location.href;
    onNavigate(href.startsWith('view-source:') ? href : `view-source:${href}`);
  };

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${isLight ? 'bg-slate-50' : 'bg-bg-primary'}`}
      onContextMenu={handleContextMenu}
    >
      {/* Animated Background Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full blur-3xl ${isLight ? 'bg-blue-200/20' : 'bg-accent-blue/5'}`}
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute -bottom-40 -right-20 w-[800px] h-[800px] rounded-full blur-3xl ${isLight ? 'bg-purple-200/20' : 'bg-accent-purple/5'}`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center"
      >
        {/* Logo/Brand */}
        <div className="mb-12 flex flex-col items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-glass-glow ${isLight ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'bg-gradient-to-br from-accent-blue to-accent-purple'}`}
          >
            <Globe size={40} className="text-white" />
          </motion.div>
          <h1 className={`text-5xl font-bold tracking-tight mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Tekeli<span className={`text-transparent bg-clip-text bg-gradient-to-r ${isLight ? 'from-blue-600 to-purple-600' : 'from-accent-blue to-accent-purple'}`}>Browser</span>
          </h1>
          <p className={isLight ? 'text-slate-500' : 'text-gray-400'}>
            Bugün ne keşfetmek istersiniz?
          </p>
        </div>

        {/* Search Bar Container */}
        <form onSubmit={handleSearch} className="w-full mb-12 relative">
          <motion.div 
            animate={{ 
              scale: isFocused ? 1.02 : 1,
              boxShadow: isFocused 
                ? (isLight ? '0 10px 40px -10px rgba(59,130,246,0.2)' : '0 0 30px rgba(0, 240, 255, 0.2)')
                : (isLight ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0,0,0,0.3)')
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
              relative flex items-center h-16 rounded-2xl backdrop-blur-xl overflow-hidden
              ${isLight 
                ? `bg-white/80 border ${isFocused ? 'border-blue-400' : 'border-slate-200'}` 
                : `bg-bg-secondary/70 ${isFocused ? 'border-accent-blue/50' : 'border-white/10'} border`}
            `}
          >
            <div className={`absolute left-5 transition-colors duration-200 ${isFocused ? (isLight ? 'text-blue-500' : 'text-accent-blue') : (isLight ? 'text-slate-400' : 'text-gray-400')}`}>
              <Search size={20} />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Web'de arayın veya bir URL girin..."
              className={`w-full h-full pl-16 pr-20 bg-transparent text-lg outline-none
                ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-gray-500'}`}
              autoFocus
            />

            {/* Search Engine Icon */}
            <div className={`absolute right-4 px-3 h-8 rounded-lg flex items-center gap-2 text-xs font-medium uppercase tracking-wider
              ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-bg-tertiary/50 text-gray-400 border border-white/5'}`}
            >
              {searchEngine === 'duckduckgo' ? 'DDG' : 'GGL'}
            </div>
          </motion.div>
        </form>

        {/* Bottom Section: Quick Links & Recent */}
        <div className="w-full flex gap-8">
          {/* Quick Links */}
          <div className="flex-1">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 pl-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
              Hızlı Bağlantılar
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <AnimatePresence>
                {quickLinks.map((link) => (
                  <motion.div
                    key={link.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ y: -5 }}
                    className="group relative flex flex-col items-center gap-3"
                  >
                    <button
                      onClick={() => onNavigate(link.url)}
                      className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isLight 
                          ? 'bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300' 
                          : 'bg-bg-secondary/80 backdrop-blur-xl border border-white/10 shadow-glass group-hover:border-accent-blue/50 group-hover:shadow-glass-active group-hover:bg-bg-secondary'}
                      `}
                    >
                      <img 
                        src={getFaviconUrl(link.url) || ''} 
                        alt="" 
                        className="w-8 h-8 rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className={`hidden ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>
                        <Globe size={24} />
                      </div>
                    </button>
                    <span className={`text-xs truncate w-full text-center px-1 transition-colors ${
                      isLight ? 'text-slate-600 group-hover:text-blue-600' : 'text-gray-400 group-hover:text-white'
                    }`}>
                      {link.name}
                    </span>

                    {/* Edit/Delete Overlay */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(link); }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors
                          ${isLight ? 'bg-white text-slate-500 hover:text-blue-500 border border-slate-200' : 'bg-bg-elevated text-gray-400 hover:text-white hover:border-accent-blue border border-white/10'}`}
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteLink(link.id, e)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors
                          ${isLight ? 'bg-white text-slate-500 hover:text-red-500 border border-slate-200' : 'bg-bg-elevated text-gray-400 hover:text-red-400 hover:border-red-400 border border-white/10'}`}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Add Button */}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center gap-3"
                >
                  <button
                    onClick={openAddModal}
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 border border-dashed
                      ${isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-slate-100 hover:text-blue-500 hover:border-blue-400' 
                        : 'bg-bg-secondary/30 backdrop-blur-xl border-white/20 text-gray-400 hover:border-white/40 hover:text-white hover:bg-bg-secondary/50'}
                    `}
                  >
                    <Plus size={24} />
                  </button>
                  <span className={`text-xs px-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                    Ekle
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Recently Closed */}
          {recentlyClosed.length > 0 && (
            <div className="w-64 flex-shrink-0">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 pl-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                Son Kapatılanlar
              </h3>
              <div className={`rounded-2xl p-2 flex flex-col gap-1 ${isLight ? 'bg-white shadow-sm border border-slate-100' : 'bg-bg-secondary/80 backdrop-blur-xl border border-white/5 shadow-glass'}`}>
                {recentlyClosed.map((tab, i) => {
                  let domain = '';
                  try { domain = new URL(tab.url).hostname; } catch {}
                  
                  return (
                    <button
                      key={`${tab.url}-${tab.closedAt}-${i}`}
                      onClick={() => onNavigate(tab.url)}
                      className={`flex items-center gap-3 p-2 rounded-xl text-left transition-colors group
                        ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                        ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-bg-elevated text-gray-400 border border-white/5 group-hover:text-accent-blue group-hover:border-accent-blue/30'}
                      `}>
                        {domain.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate transition-colors ${isLight ? 'text-slate-700 group-hover:text-blue-600' : 'text-gray-300 group-hover:text-white'}`}>
                          {tab.title}
                        </p>
                        <p className={`text-[10px] truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                          {domain}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`absolute z-50 w-full max-w-md border rounded-3xl shadow-2xl p-6 ${
                isLight ? 'bg-white border-slate-200' : 'bg-bg-secondary border-white/10 shadow-glass-glow'
              }`}
            >
              <h2 className={`text-xl font-semibold mb-6 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {editingLink ? 'Bağlantıyı Düzenle' : 'Hızlı Bağlantı Ekle'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>İsim</label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="Örn: GitHub"
                    className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-1 transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 focus:ring-blue-100' 
                        : 'bg-black/20 border-white/10 text-white placeholder-gray-600 focus:border-accent-blue/50 focus:ring-accent-blue/50'
                    }`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>URL</label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveLink()}
                    placeholder="Örn: github.com"
                    className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-1 transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 focus:ring-blue-100' 
                        : 'bg-black/20 border-white/10 text-white placeholder-gray-600 focus:border-accent-blue/50 focus:ring-accent-blue/50'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 justify-end">
                <button
                  onClick={() => setIsAdding(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveLink}
                  disabled={!newLinkName.trim() || !newLinkUrl.trim()}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLight 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-accent-blue text-black hover:bg-accent-blue/90'
                  }`}
                >
                  {editingLink ? 'Kaydet' : 'Ekle'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`fixed z-50 w-48 py-1 rounded-xl border shadow-2xl ${
              isLight ? 'bg-white border-slate-200 shadow-black/20' : 'bg-bg-secondary/95 backdrop-blur-xl border-white/10 shadow-glass-glow'
            }`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleReloadPage}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isLight ? 'text-slate-700 hover:bg-slate-50 hover:text-blue-600' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Yenile
            </button>
            <button
              onClick={handleAddQuickLinkFromMenu}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isLight ? 'text-slate-700 hover:bg-slate-50 hover:text-blue-600' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Hızlı Bağlantı Ekle
            </button>
            <div className={`h-px my-1 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`} />
            <button
              onClick={handleViewSourceFromMenu}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isLight ? 'text-slate-700 hover:bg-slate-50 hover:text-blue-600' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Sayfa Kaynağını Görüntüle
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewTabPage;
