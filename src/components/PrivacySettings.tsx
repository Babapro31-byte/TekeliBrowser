import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchEngine } from '../types/electron';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type CookiePolicy = 'all' | 'block-third-party' | 'block-all';

const PERMISSION_LABELS: Record<string, string> = {
  media: 'Kamera / Mikrofon',
  microphone: 'Mikrofon',
  camera: 'Kamera',
  geolocation: 'Konum',
  notifications: 'Bildirimler'
};

const PrivacySettings = ({ isOpen, onClose }: PrivacySettingsProps) => {
  const [trackerBlocking, setTrackerBlocking] = useState(true);
  const [cookiePolicy, setCookiePolicy] = useState<CookiePolicy>('all');
  const [sitePermissions, setSitePermissions] = useState<Record<string, Record<string, 'allow' | 'block'>>>({});
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');

  const loadSettings = useCallback(async () => {
    try {
      const [trackerRes, cookieRes, permsRes, searchRes] = await Promise.all([
        window.electron?.getTrackerBlocking?.(),
        window.electron?.getCookiePolicy?.(),
        window.electron?.getAllPermissions?.(),
        window.electron?.getSearchEngine?.()
      ]);
      if (trackerRes?.enabled !== undefined) setTrackerBlocking(trackerRes.enabled);
      if (cookieRes?.policy) setCookiePolicy(cookieRes.policy);
      if (permsRes) setSitePermissions(permsRes);
      if (searchRes?.engine) setSearchEngine(searchRes.engine);
    } catch (err) {
      console.error('[PrivacySettings] Load failed:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadSettings();
  }, [isOpen, loadSettings]);

  const handleTrackerToggle = async (enabled: boolean) => {
    try {
      await window.electron?.setTrackerBlocking?.(enabled);
      setTrackerBlocking(enabled);
    } catch (err) {
      console.error('[PrivacySettings] Tracker toggle failed:', err);
    }
  };

  const handleCookiePolicyChange = async (policy: CookiePolicy) => {
    try {
      await window.electron?.setCookiePolicy?.(policy);
      setCookiePolicy(policy);
    } catch (err) {
      console.error('[PrivacySettings] Cookie policy change failed:', err);
    }
  };

  const handleSearchEngineChange = async (engine: SearchEngine) => {
    try {
      await window.electron?.setSearchEngine?.(engine);
      setSearchEngine(engine);
    } catch (err) {
      console.error('[PrivacySettings] Search engine change failed:', err);
    }
  };

  const handleClearSitePermission = async (site: string, permission?: string) => {
    try {
      await window.electron?.clearSitePermission?.(site, permission);
      await loadSettings();
    } catch (err) {
      console.error('[PrivacySettings] Clear permission failed:', err);
    }
  };

  const handleClearAllPermissions = async () => {
    try {
      await window.electron?.clearSitePermission?.();
      setSitePermissions({});
    } catch (err) {
      console.error('[PrivacySettings] Clear all failed:', err);
    }
  };

  const sites = Object.entries(sitePermissions);
  const hasPermissions = sites.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-dark-surface border-l border-neon-blue/20 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-neon-blue/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Gizlilik Ayarları</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Tracker Blocking */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/90">İzleyici Engelleme</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50 border border-white/5">
                  <span className="text-sm text-white/70">Tracker ve reklam izleyicilerini engelle</span>
                  <button
                    onClick={() => handleTrackerToggle(!trackerBlocking)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      trackerBlocking ? 'bg-neon-blue' : 'bg-white/20'
                    }`}
                  >
                    <motion.div
                      layout
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      animate={{ left: trackerBlocking ? 28 : 4 }}
                    />
                  </button>
                </div>
              </div>

              {/* Default Search Engine */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/90">Varsayılan Arama Motoru</h3>
                <div className="space-y-2">
                  {(['duckduckgo', 'google'] as const).map((engine) => (
                    <label
                      key={engine}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        searchEngine === engine
                          ? 'bg-neon-blue/10 border-neon-blue/30'
                          : 'bg-dark-bg/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="searchEngine"
                        checked={searchEngine === engine}
                        onChange={() => handleSearchEngineChange(engine)}
                        className="text-neon-blue focus:ring-neon-blue"
                      />
                      <span className="text-sm text-white/80">
                        {engine === 'duckduckgo' && 'DuckDuckGo'}
                        {engine === 'google' && 'Google'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3rd-Party Cookies */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/90">Çerez Politikası</h3>
                <div className="space-y-2">
                  {(['all', 'block-third-party', 'block-all'] as const).map((policy) => (
                    <label
                      key={policy}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        cookiePolicy === policy
                          ? 'bg-neon-blue/10 border-neon-blue/30'
                          : 'bg-dark-bg/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cookiePolicy"
                        checked={cookiePolicy === policy}
                        onChange={() => handleCookiePolicyChange(policy)}
                        className="text-neon-blue focus:ring-neon-blue"
                      />
                      <span className="text-sm text-white/80">
                        {policy === 'all' && 'Tüm çerezler'}
                        {policy === 'block-third-party' && '3. taraf çerezleri engelle'}
                        {policy === 'block-all' && 'Tüm çerezleri engelle'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Site Permissions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/90">Site İzinleri</h3>
                  {hasPermissions && (
                    <button
                      onClick={handleClearAllPermissions}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Tümünü temizle
                    </button>
                  )}
                </div>
                {hasPermissions ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sites.map(([site, perms]) => (
                      <div
                        key={site}
                        className="p-3 rounded-lg bg-dark-bg/50 border border-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neon-blue">{site}</span>
                          <button
                            onClick={() => handleClearSitePermission(site)}
                            className="text-xs text-white/50 hover:text-red-400 transition-colors"
                          >
                            Kaldır
                          </button>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(perms).map(([perm, decision]) => (
                            <div key={perm} className="flex items-center justify-between text-xs">
                              <span className="text-white/60">
                                {PERMISSION_LABELS[perm] || perm}: {decision === 'allow' ? 'İzin verildi' : 'Engellendi'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/50 py-4">Henüz site izni verilmedi</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PrivacySettings;
