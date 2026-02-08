import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClosedTab, SearchEngine } from '../types/electron';
import { resolveOmniboxInput } from '../utils/omnibox';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
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

const NewTabPage = ({ onNavigate }: NewTabPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalUrl, setModalUrl] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [recentlyClosed, setRecentlyClosed] = useState<ClosedTab[]>([]);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');

  // Load quick links from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setQuickLinks(JSON.parse(saved));
      } else {
        setQuickLinks(DEFAULT_LINKS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LINKS));
      }
    } catch {
      setQuickLinks(DEFAULT_LINKS);
    }
  }, []);

  // Load recently closed tabs
  useEffect(() => {
    const loadClosed = async () => {
      if (!window.electron?.getRecentlyClosed) return;
      try {
        const tabs = await window.electron.getRecentlyClosed();
        setRecentlyClosed(tabs?.slice(0, 5) || []);
      } catch {
        setRecentlyClosed([]);
      }
    };
    loadClosed();
  }, []);

  // Load default search engine
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!window.electron?.getSearchEngine) return;
        const res = await window.electron.getSearchEngine();
        if (mounted && res?.engine) setSearchEngine(res.engine);
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
    
    const query = searchQuery.trim();
    const url = resolveOmniboxInput(query, searchEngine);
    if (url) onNavigate(url);
  }, [searchQuery, onNavigate, searchEngine]);

  const openAddModal = () => {
    setEditingLink(null);
    setModalName('');
    setModalUrl('');
    setShowModal(true);
  };

  const openEditModal = (link: QuickLink) => {
    setEditingLink(link);
    setModalName(link.name);
    setModalUrl(link.url);
    setShowModal(true);
  };

  const handleSaveLink = () => {
    if (!modalName.trim() || !modalUrl.trim()) return;

    let url = modalUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (editingLink) {
      // Update existing link
      const updatedLinks = quickLinks.map(link => 
        link.id === editingLink.id 
          ? { ...link, name: modalName.trim(), url }
          : link
      );
      saveLinks(updatedLinks);
    } else {
      // Add new link
      const newLink: QuickLink = {
        id: Date.now().toString(),
        name: modalName.trim(),
        url
      };
      saveLinks([...quickLinks, newLink]);
    }

    setShowModal(false);
    setModalName('');
    setModalUrl('');
    setEditingLink(null);
  };

  const handleDeleteLink = (id: string) => {
    const updatedLinks = quickLinks.filter(link => link.id !== id);
    saveLinks(updatedLinks);
  };

  // Right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Close context menu on click anywhere
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

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
      className="w-full h-full bg-dark-bg flex flex-col items-center justify-center relative overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      {/* Animated Background Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large cyan blob - top left */}
        <motion.div
          animate={{ 
            x: [0, 40, 0], 
            y: [0, -30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-3xl"
        />
        
        {/* Purple blob - right side */}
        <motion.div
          animate={{ 
            x: [0, -50, 0], 
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
        />
        
        {/* Blue blob - center */}
        <motion.div
          animate={{ 
            x: [0, 30, -20, 0], 
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/6 rounded-full blur-3xl"
        />
        
        {/* Magenta blob - bottom left */}
        <motion.div
          animate={{ 
            x: [0, 60, 0], 
            y: [0, -40, 0],
            scale: [1, 1.25, 1]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -left-20 w-[450px] h-[450px] bg-fuchsia-500/8 rounded-full blur-3xl"
        />
        
        {/* Teal blob - bottom right */}
        <motion.div
          animate={{ 
            x: [0, -30, 20, 0], 
            y: [0, 50, -10, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-teal-400/7 rounded-full blur-3xl"
        />

        {/* Small accent blob - floating */}
        <motion.div
          animate={{ 
            x: [0, 100, -50, 0], 
            y: [0, -80, 40, 0],
            scale: [1, 1.3, 0.8, 1],
            opacity: [0.5, 0.8, 0.4, 0.5]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-[200px] h-[200px] bg-violet-400/10 rounded-full blur-2xl"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center gap-8 px-4"
      >
        {/* Atom Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          className="relative w-52 h-52 flex items-center justify-center"
        >
          {/* Pulsing glow behind */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-cyan-400/25 to-blue-500/15 rounded-full blur-2xl" 
          />

          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: `
              <svg viewBox="0 0 300 300" width="100%" height="100%">
                <defs>
                  <radialGradient id="coreSphere" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
                    <stop offset="20%" stop-color="#e0f7ff" stop-opacity="0.95"/>
                    <stop offset="45%" stop-color="#67e8f9" stop-opacity="0.8"/>
                    <stop offset="70%" stop-color="#0891b2" stop-opacity="0.55"/>
                    <stop offset="100%" stop-color="#032a33" stop-opacity="0.9"/>
                  </radialGradient>
                  <radialGradient id="eSphere" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
                    <stop offset="25%" stop-color="#e0f7ff" stop-opacity="0.95"/>
                    <stop offset="50%" stop-color="#67e8f9" stop-opacity="0.8"/>
                    <stop offset="75%" stop-color="#0891b2" stop-opacity="0.55"/>
                    <stop offset="100%" stop-color="#032a33" stop-opacity="0.9"/>
                  </radialGradient>
                  <filter id="eGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="cGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <style>
                  @keyframes e1 {
                    0%     { transform: translate(70px, 0px); }
                    8.33%  { transform: translate(60.6px, 14px); }
                    16.67% { transform: translate(35px, 24.2px); }
                    25%    { transform: translate(0px, 28px); }
                    33.33% { transform: translate(-35px, 24.2px); }
                    41.67% { transform: translate(-60.6px, 14px); }
                    50%    { transform: translate(-70px, 0px); }
                    58.33% { transform: translate(-60.6px, -14px); }
                    66.67% { transform: translate(-35px, -24.2px); }
                    75%    { transform: translate(0px, -28px); }
                    83.33% { transform: translate(35px, -24.2px); }
                    91.67% { transform: translate(60.6px, -14px); }
                    100%   { transform: translate(70px, 0px); }
                  }
                  @keyframes e2 {
                    0%     { transform: translate(90px, 0px); }
                    8.33%  { transform: translate(77.9px, 17.5px); }
                    16.67% { transform: translate(45px, 30.3px); }
                    25%    { transform: translate(0px, 35px); }
                    33.33% { transform: translate(-45px, 30.3px); }
                    41.67% { transform: translate(-77.9px, 17.5px); }
                    50%    { transform: translate(-90px, 0px); }
                    58.33% { transform: translate(-77.9px, -17.5px); }
                    66.67% { transform: translate(-45px, -30.3px); }
                    75%    { transform: translate(0px, -35px); }
                    83.33% { transform: translate(45px, -30.3px); }
                    91.67% { transform: translate(77.9px, -17.5px); }
                    100%   { transform: translate(90px, 0px); }
                  }
                  @keyframes e3 {
                    0%     { transform: translate(110px, 0px); }
                    8.33%  { transform: translate(95.3px, 21px); }
                    16.67% { transform: translate(55px, 36.4px); }
                    25%    { transform: translate(0px, 42px); }
                    33.33% { transform: translate(-55px, 36.4px); }
                    41.67% { transform: translate(-95.3px, 21px); }
                    50%    { transform: translate(-110px, 0px); }
                    58.33% { transform: translate(-95.3px, -21px); }
                    66.67% { transform: translate(-55px, -36.4px); }
                    75%    { transform: translate(0px, -42px); }
                    83.33% { transform: translate(55px, -36.4px); }
                    91.67% { transform: translate(95.3px, -21px); }
                    100%   { transform: translate(110px, 0px); }
                  }
                </style>

                <!-- Orbit 1: tilted -60deg -->
                <g transform="rotate(-60,150,150)">
                  <ellipse cx="150" cy="150" rx="70" ry="28" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="0.8"/>
                  <circle cx="150" cy="150" r="8" fill="url(#eSphere)" filter="url(#eGlow)" style="animation: e1 4s linear infinite;"/>
                  <circle cx="150" cy="150" r="8" fill="url(#eSphere)" filter="url(#eGlow)" style="animation: e1 4s linear infinite; animation-delay: -2s;"/>
                </g>

                <!-- Orbit 2: tilted 0deg -->
                <g>
                  <ellipse cx="150" cy="150" rx="90" ry="35" fill="none" stroke="rgba(0,212,255,0.12)" stroke-width="0.8"/>
                  <circle cx="150" cy="150" r="8" fill="url(#eSphere)" filter="url(#eGlow)" style="animation: e2 6s linear infinite;"/>
                  <circle cx="150" cy="150" r="8" fill="url(#eSphere)" filter="url(#eGlow)" style="animation: e2 6s linear infinite; animation-delay: -3s;"/>
                </g>

                <!-- Orbit 3: tilted 60deg -->
                <g transform="rotate(60,150,150)">
                  <ellipse cx="150" cy="150" rx="110" ry="42" fill="none" stroke="rgba(0,212,255,0.1)" stroke-width="0.8"/>
                  <circle cx="150" cy="150" r="8" fill="url(#eSphere)" filter="url(#eGlow)" style="animation: e3 8s linear infinite;"/>
                  <circle cx="150" cy="150" r="8" fill="url(#eSphere)" filter="url(#eGlow)" style="animation: e3 8s linear infinite; animation-delay: -4s;"/>
                </g>

                <!-- Core sphere - static -->
                <circle cx="150" cy="150" r="22" fill="url(#coreSphere)" filter="url(#cGlow)"/>
              </svg>
            ` }}
          />
        </motion.div>
        
        {/* Browser Name */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-light tracking-wide"
        >
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Tekeli</span>
          <span className="text-white/80">Browser</span>
        </motion.h1>
        
        {/* Search Box */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleSearch}
          className="w-full max-w-xl"
        >
          <div className={`
            relative flex items-center rounded-2xl transition-all duration-300
            ${isFocused 
              ? 'bg-dark-surface/80 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
              : 'bg-dark-surface/60 border-2 border-white/10 hover:border-white/20'
            }
          `}>
            <div className="pl-4 pr-2">
              <svg 
                className={`w-5 h-5 transition-colors ${isFocused ? 'text-cyan-400' : 'text-white/40'}`} 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ara veya URL gir"
              className="flex-1 py-4 pr-4 bg-transparent text-white placeholder-white/40 outline-none text-base"
              autoFocus
            />
            
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="submit"
                className="mr-3 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-shadow"
              >
                Ara
              </motion.button>
            )}
          </div>
          
          <p className="text-center text-white/30 text-xs mt-3">
            DuckDuckGo ile arama yap veya direkt URL'e git
          </p>
        </motion.form>
        
        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-4 max-w-2xl"
        >
          <AnimatePresence mode="popLayout">
            {quickLinks.map((link) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate(link.url)}
                  className="px-4 py-2 rounded-xl bg-dark-surface/50 border border-white/5 hover:border-cyan-500/30 text-white/70 hover:text-white text-sm transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  {link.name}
                </motion.button>
                
                {/* Edit/Delete buttons on hover */}
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(link);
                    }}
                    className="w-5 h-5 rounded-full bg-blue-500/80 hover:bg-blue-500 flex items-center justify-center text-white transition-colors"
                    title="Düzenle"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLink(link.id);
                    }}
                    className="w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                    title="Sil"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Add Link Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-dark-surface/30 border border-dashed border-white/20 hover:border-cyan-500/50 text-white/40 hover:text-cyan-400 text-sm transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ekle
          </motion.button>
        </motion.div>
        {/* Recently Closed Tabs */}
        {recentlyClosed.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 w-full max-w-xl"
          >
            <p className="text-white/30 text-xs mb-3 px-1">Son kapatilan sekmeler</p>
            <div className="space-y-1">
              {recentlyClosed.map((tab, i) => (
                <motion.button
                  key={`${tab.url}-${tab.closedAt}-${i}`}
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate(tab.url)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-surface/30 hover:bg-dark-surface/50 border border-white/5 hover:border-cyan-500/20 transition-all text-left group"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400/60">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/60 group-hover:text-white/80 truncate transition-colors">
                    {tab.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                {editingLink ? 'Link Düzenle' : 'Yeni Link Ekle'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">İsim</label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="örn: YouTube"
                    className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-2">URL</label>
                  <input
                    type="text"
                    value={modalUrl}
                    onChange={(e) => setModalUrl(e.target.value)}
                    placeholder="örn: youtube.com"
                    className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveLink}
                  disabled={!modalName.trim() || !modalUrl.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  {editingLink ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Right-click Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] min-w-[180px] py-1.5 rounded-xl bg-dark-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleReloadPage}
              className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Sayfayi Yenile
            </button>
            <button
              onClick={handleAddQuickLinkFromMenu}
              className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Yer Imi Ekle
            </button>
            <div className="mx-3 my-1 h-px bg-white/10" />
            <button
              onClick={handleViewSourceFromMenu}
              className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                <path d="M16 18l2-2v-4l-2-2" />
                <path d="M8 18l-2-2v-4l2-2" />
                <path d="M14.5 4l-5 16" />
              </svg>
              Kaynak Kodunu Gor
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 text-white/20 text-xs">
        TekeliBrowser v2.1.1
      </div>
    </div>
  );
};

export default NewTabPage;
