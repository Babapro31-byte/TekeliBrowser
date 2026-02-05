import { useState, KeyboardEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onToggleSplitView: () => void;
  splitViewActive: boolean;
  onToggleSidebar: () => void;
}

const AddressBar = ({ 
  currentUrl, 
  onNavigate, 
  onBack, 
  onForward, 
  onReload,
  onToggleSplitView,
  splitViewActive,
  onToggleSidebar
}: AddressBarProps) => {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [blockedAds, setBlockedAds] = useState(0);
  const [showShieldPopup, setShowShieldPopup] = useState(false);

  // Sync input with currentUrl when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(currentUrl);
    }
  }, [currentUrl, isFocused]);

  // Fetch ad block stats (less frequently for performance)
  useEffect(() => {
    let mounted = true;
    
    const fetchStats = async () => {
      if (!mounted) return;
      try {
        if (window.electron?.getAdBlockStats) {
          const stats = await window.electron.getAdBlockStats();
          if (mounted) setBlockedAds(stats.session);
        }
      } catch (e) {}
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Every 5 seconds
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let url = inputValue.trim();
      
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Check if it looks like a URL
        if (url.includes('.') && !url.includes(' ')) {
          url = 'https://' + url;
        } else {
          // Treat as search query
          url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }
      
      onNavigate(url);
      setInputValue(url);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="h-14 bg-dark-surface/40 backdrop-blur-md border-b border-neon-blue/10 flex items-center px-4 space-x-3">
      {/* Navigation Buttons */}
      <div className="flex items-center space-x-2">
        <NavButton onClick={onBack} title="Geri">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4L6 8L10 12" />
          </svg>
        </NavButton>
        
        <NavButton onClick={onForward} title="İleri">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4L10 8L6 12" />
          </svg>
        </NavButton>
        
        <NavButton onClick={onReload} title="Yenile">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.7614 2 13 4.23858 13 7" />
            <path d="M10 7H13V4" />
          </svg>
        </NavButton>
      </div>
      
      {/* Shield Button - Ad Blocker Status */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShieldPopup(!showShieldPopup)}
          title="Reklam Engelleyici"
          className="w-9 h-9 rounded-lg glass flex items-center justify-center transition-all relative
                     text-emerald-400 hover:text-emerald-300 neon-glow-green"
          style={{
            boxShadow: blockedAds > 0 
              ? '0 0 10px rgba(52, 211, 153, 0.4), 0 0 20px rgba(52, 211, 153, 0.2)' 
              : 'none'
          }}
        >
          {/* Shield Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          
          {/* Blocked count badge */}
          {blockedAds > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 
                         rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
            >
              {blockedAds > 99 ? '99+' : blockedAds}
            </motion.div>
          )}
        </motion.button>

        {/* Shield Popup */}
        <AnimatePresence>
          {showShieldPopup && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute top-12 left-0 w-64 glass rounded-xl border border-emerald-500/20 p-4 z-50"
              style={{ boxShadow: '0 0 30px rgba(52, 211, 153, 0.2)' }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 
                               flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Koruma Aktif</h3>
                  <p className="text-emerald-400 text-xs">Brave seviyesi engelleme</p>
                </div>
              </div>
              
              <div className="bg-dark-bg/50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Engellenen Reklamlar</span>
                  <span className="text-emerald-400 font-bold text-lg">{blockedAds}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex items-center space-x-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-emerald-400">
                    <path d="M6 0L0 3v3.5c0 3.05 2.56 5.91 6 6.5 3.44-.59 6-3.45 6-6.5V3L6 0z"/>
                  </svg>
                  <span>YouTube Reklam Atlama</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-emerald-400">
                    <path d="M6 0L0 3v3.5c0 3.05 2.56 5.91 6 6.5 3.44-.59 6-3.45 6-6.5V3L6 0z"/>
                  </svg>
                  <span>İzleyici/Tracker Engelleme</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-emerald-400">
                    <path d="M6 0L0 3v3.5c0 3.05 2.56 5.91 6 6.5 3.44-.59 6-3.45 6-6.5V3L6 0z"/>
                  </svg>
                  <span>Gizlilik Koruması</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Address Input (Omnibox) */}
      <motion.div 
        className={`flex-1 h-9 rounded-full glass flex items-center px-4 transition-all ${
          isFocused ? 'neon-glow ring-2 ring-neon-blue/30' : ''
        }`}
        animate={{ 
          boxShadow: isFocused 
            ? '0 0 20px rgba(0, 240, 255, 0.3)' 
            : '0 0 5px rgba(0, 240, 255, 0.1)' 
        }}
      >
        {/* Lock Icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neon-blue/70 mr-2">
          <path d="M7 1C5.34315 1 4 2.34315 4 4V6H3C2.44772 6 2 6.44772 2 7V12C2 12.5523 2.44772 13 3 13H11C11.5523 13 12 12.5523 12 12V7C12 6.44772 11.5523 6 11 6H10V4C10 2.34315 8.65685 1 7 1Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setInputValue(currentUrl);
          }}
          placeholder="URL veya arama terimi girin..."
          className="flex-1 bg-transparent text-white/90 text-sm outline-none placeholder-white/40"
        />
      </motion.div>
      
      {/* Feature Buttons */}
      <div className="flex items-center space-x-2">
        <FeatureButton 
          onClick={onToggleSplitView} 
          title="Bölünmüş Görünüm"
          active={splitViewActive}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="6" height="12" />
            <rect x="10" y="3" width="6" height="12" />
          </svg>
        </FeatureButton>
        
        <FeatureButton onClick={onToggleSidebar} title="AI Asistan">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="6" r="3" />
            <path d="M3 16C3 13.2386 5.23858 11 8 11H10C12.7614 11 15 13.2386 15 16" />
          </svg>
        </FeatureButton>
      </div>
    </div>
  );
};

// Helper Components
const NavButton = ({ onClick, children, title }: any) => (
  <motion.button
    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 240, 255, 0.1)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-neon-blue transition-colors"
  >
    {children}
  </motion.button>
);

const FeatureButton = ({ onClick, children, title, active = false }: any) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    className={`w-9 h-9 rounded-lg glass flex items-center justify-center transition-all ${
      active ? 'neon-glow text-neon-blue' : 'text-white/70 hover:text-neon-purple'
    }`}
  >
    {children}
  </motion.button>
);

export default AddressBar;
