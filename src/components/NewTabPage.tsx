import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Save quick links to localStorage
  const saveLinks = useCallback((links: QuickLink[]) => {
    setQuickLinks(links);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.trim();
    const isUrl = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/.test(query);
    
    if (isUrl) {
      const url = query.startsWith('http') ? query : `https://${query}`;
      onNavigate(url);
    } else {
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
      onNavigate(searchUrl);
    }
  }, [searchQuery, onNavigate]);

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

  return (
    <div className="w-full h-full bg-dark-bg flex flex-col items-center justify-center relative overflow-hidden">
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
        {/* Logo with glow animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <img src="/logo.svg" alt="TekeliBrowser" className="w-32 h-32 drop-shadow-2xl" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-purple-500/30 rounded-full blur-xl -z-10" 
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
      
      <div className="absolute bottom-4 text-white/20 text-xs">
        TekeliBrowser v1.1
      </div>
    </div>
  );
};

export default NewTabPage;
