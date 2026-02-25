import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  EyeOff,
  Fingerprint,
  Image as ImageIcon,
  Layout,
  Lock,
  ShieldCheck,
  Trash2,
  Palette
} from 'lucide-react';
import type { ThemeColor, PrivacyLevel, ThemeId } from '../utils/themes';
import { colorClasses, getThemes } from '../utils/themes';

export type { ThemeColor, PrivacyLevel, ThemeId };
export type TabLayout = 'horizontal' | 'vertical';

type SettingsPanelProps = {
  themeColor: ThemeColor;
  setThemeColor: (next: ThemeColor) => void;
  privacyLevel: PrivacyLevel;
  setPrivacyLevel: (next: PrivacyLevel) => void;
  tabLayout: TabLayout;
  setTabLayout: (next: TabLayout) => void;
  activeThemeId: ThemeId;
  setActiveThemeId: (next: ThemeId) => void;
};

// Individual privacy feature toggles
type PrivacyFeatures = {
  trackerBlocker: boolean;
  httpsOnly: boolean;
  fingerprintProtection: boolean;
  cookieIsolation: boolean;
};

const SettingsPanel = ({
  themeColor,
  setThemeColor,
  privacyLevel,
  setPrivacyLevel,
  tabLayout,
  setTabLayout,
  activeThemeId,
  setActiveThemeId
}: SettingsPanelProps) => {
  const isLight = activeThemeId === 'light';
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [customBgInput, setCustomBgInput] = useState('');
  const [blockedCount, setBlockedCount] = useState(0);

  const [privacyFeatures, setPrivacyFeatures] = useState<PrivacyFeatures>({
    trackerBlocker: true,
    httpsOnly: true,
    fingerprintProtection: true,
    cookieIsolation: false
  });

  useEffect(() => {
    // Sync individual features based on overall privacy level on mount or when level changes
    setPrivacyFeatures({
      trackerBlocker: privacyLevel !== 'off',
      httpsOnly: privacyLevel === 'strict',
      fingerprintProtection: privacyLevel === 'strict',
      cookieIsolation: privacyLevel === 'strict'
    });
  }, [privacyLevel]);

  const handleSave = () => {
    try {
      const prefs = {
        theme: themeColor,
        themeId: activeThemeId,
        privacyLevel,
        customBg: bgImage,
        tabLayout,
        privacyFeatures
      };
      localStorage.setItem('tekeli-preferences', JSON.stringify(prefs));
      
      // Still apply to window.electron where possible
      if (window.electron?.setCookiePolicy) {
        window.electron.setCookiePolicy(
          privacyLevel === 'off' ? 'all' : 
          privacyLevel === 'strict' ? 'block-all' : 'block-third-party'
        );
      }
      if (window.electron?.setTrackerBlocking) {
        window.electron.setTrackerBlocking(privacyLevel !== 'off');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  useEffect(() => {
    handleSave();
  }, [themeColor, activeThemeId, privacyLevel, bgImage, tabLayout, privacyFeatures]);

  useEffect(() => {
    let mounted = true;
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('tekeli-preferences');
        if (mounted && saved) {
          const prefs = JSON.parse(saved);
          if (prefs.theme) setThemeColor(prefs.theme as ThemeColor);
          if (prefs.themeId) setActiveThemeId(prefs.themeId as ThemeId);
          if (prefs.privacyLevel) setPrivacyLevel(prefs.privacyLevel as PrivacyLevel);
          if (prefs.customBg !== undefined) setBgImage(prefs.customBg);
          if (prefs.tabLayout) setTabLayout(prefs.tabLayout as TabLayout);
          if (prefs.privacyFeatures) setPrivacyFeatures(prefs.privacyFeatures);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();

    const fetchStats = async () => {
      if (!window.electron?.getAdBlockStats) return;
      try {
        const stats = await window.electron.getAdBlockStats();
        if (mounted && stats) setBlockedCount(stats.session);
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setThemeColor, setActiveThemeId, setPrivacyLevel, setTabLayout]);

  // Auto-save when settings change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      handleSave();
    }, 500); // Debounce saves

    return () => {
      clearTimeout(saveTimeout);
    };
  }, [themeColor, activeThemeId, privacyLevel, bgImage, tabLayout, privacyFeatures]);

  const activeColor = colorClasses[themeColor] || colorClasses.indigo;
  const toggleFeature = (feature: keyof PrivacyFeatures) => {
    setPrivacyFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };
  const themes = getThemes(activeColor);

  const handleApplyBg = () => {
    if (customBgInput.trim()) {
      setBgImage(customBgInput);
      setCustomBgInput('');
      handleSave();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setBgImage(objectUrl);
      handleSave();
    }
  };

  return (
    <div className={`w-full h-full overflow-y-auto p-6 md:p-10 scrollbar-hide ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-bg-primary text-white'}`}>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue shadow-glass-glow">
            <Layout size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tarayıcını Şekillendir</h1>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Temanızı, gizlilik ayarlarınızı ve görünümü kişiselleştirin.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            
            {/* Theme Settings - Floating Island */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-6 rounded-3xl backdrop-blur-xl border shadow-glass ${isLight ? 'bg-white border-slate-200' : 'bg-bg-secondary/80 border-white/5'}`}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <Palette size={20} className={isLight ? 'text-blue-500' : 'text-accent-blue'} /> Tema Seçimi
              </h2>
              
              <div className="space-y-4">
                {Object.values(themes).map(themeObj => (
                  <label
                    key={themeObj.id}
                    className={`
                      relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300
                      ${activeThemeId === themeObj.id 
                        ? (isLight ? 'bg-blue-50 border-2 border-blue-400' : 'bg-bg-elevated border-2 border-accent-blue shadow-[0_0_15px_rgba(0,240,255,0.15)]') 
                        : (isLight ? 'bg-slate-50 border-2 border-transparent hover:bg-slate-100' : 'bg-black/20 border-2 border-transparent hover:bg-white/5')
                      }
                    `}
                    onClick={() => setActiveThemeId(themeObj.id)}
                  >
                    <div className="flex-1">
                      <div className={`font-semibold ${activeThemeId === themeObj.id ? (isLight ? 'text-blue-700' : 'text-accent-blue') : ''}`}>
                        {themeObj.name}
                      </div>
                      <div className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        {themeObj.desc}
                      </div>
                    </div>
                    
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex flex-shrink-0 items-center justify-center transition-colors
                      ${activeThemeId === themeObj.id 
                        ? (isLight ? 'border-blue-500 bg-blue-500' : 'border-accent-blue bg-accent-blue') 
                        : (isLight ? 'border-slate-300' : 'border-gray-600')
                      }
                    `}>
                      {activeThemeId === themeObj.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    {/* Color picker for Neon theme */}
                    <AnimatePresence>
                      {themeObj.id !== 'zen' && activeThemeId === themeObj.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="absolute -bottom-16 left-0 right-0 p-3 rounded-xl flex gap-3 flex-wrap z-10"
                        >
                          <div className={`p-2 rounded-xl flex gap-2 w-full ${isLight ? 'bg-white shadow-lg border border-slate-200' : 'bg-bg-secondary border border-white/10 shadow-glass-glow'}`}>
                            {(Object.keys(colorClasses) as ThemeColor[]).map(colorKey => (
                              <button
                                key={colorKey}
                                className={`w-8 h-8 rounded-full transition-transform ${
                                  themeColor === colorKey ? 'scale-110 ring-2 ring-offset-2 ' + (isLight ? 'ring-offset-white ring-blue-400' : 'ring-offset-bg-secondary ring-accent-blue') : 'hover:scale-105'
                                }`}
                                style={{ background: `var(--${colorKey}-gradient, ${colorKey === 'indigo' ? '#6366f1' : colorKey === 'rose' ? '#f43f5e' : colorKey === 'emerald' ? '#10b981' : colorKey === 'orange' ? '#f97316' : colorKey === 'cyan' ? '#06b6d4' : '#8b5cf6'})` }}
                                onClick={(e) => { e.preventDefault(); setThemeColor(colorKey); }}
                                title={colorKey}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Layout Settings - Floating Island */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-6 rounded-3xl backdrop-blur-xl border shadow-glass ${isLight ? 'bg-white border-slate-200' : 'bg-bg-secondary/80 border-white/5'} ${activeThemeId !== 'zen' ? 'mt-20' : ''}`}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <Layout size={20} className={isLight ? 'text-blue-500' : 'text-accent-blue'} /> Sekme Düzeni
              </h2>
              
              <div className={`flex p-1.5 rounded-xl ${isLight ? 'bg-slate-100' : 'bg-black/40 border border-white/5'}`}>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                    tabLayout === 'horizontal' 
                      ? (isLight 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'bg-bg-elevated text-accent-blue shadow-glass-active') 
                      : (isLight 
                          ? 'text-slate-500 hover:text-slate-700' 
                          : 'text-gray-400 hover:text-white')
                  }`}
                  onClick={() => setTabLayout('horizontal')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-3 border-t-2 border-current rounded-sm opacity-70" /> Yatay
                  </div>
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                    tabLayout === 'vertical' 
                      ? (isLight 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'bg-bg-elevated text-accent-blue shadow-glass-active') 
                      : (isLight 
                          ? 'text-slate-500 hover:text-slate-700' 
                          : 'text-gray-400 hover:text-white')
                  }`}
                  onClick={() => setTabLayout('vertical')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-4 border-l-2 border-current rounded-sm opacity-70" /> Dikey
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Privacy Settings - Floating Island */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-6 rounded-3xl backdrop-blur-xl border shadow-glass ${isLight ? 'bg-white border-slate-200' : 'bg-bg-secondary/80 border-white/5'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <ShieldCheck size={20} className={isLight ? 'text-green-500' : 'text-accent-green'} /> Gizlilik
                </h2>
                
                {/* Blocked Counter Mini-badge */}
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${isLight ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-accent-green/10 text-accent-green border border-accent-green/20'}`}>
                  <ShieldCheck size={14} />
                  {blockedCount.toLocaleString('en-US')} Engellendi
                </div>
              </div>

              {/* Preset Levels */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(['off', 'standard', 'strict'] as PrivacyLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setPrivacyLevel(level)}
                    className={`
                      py-3 px-2 text-xs font-medium rounded-xl border transition-all text-center
                      ${privacyLevel === level 
                        ? (isLight 
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' 
                            : 'bg-accent-blue/10 border-accent-blue text-accent-blue shadow-[0_0_10px_rgba(0,240,255,0.2)]')
                        : (isLight 
                            ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100' 
                            : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5')
                      }
                    `}
                  >
                    {level === 'off' ? 'Kapalı' : level === 'standard' ? 'Dengeli' : 'Katı'}
                  </button>
                ))}
              </div>

              {/* 4 Individual Feature Toggles */}
              <div className="space-y-3">
                <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Aktif Modüller</div>

                {/* Tracker Blocker */}
                <FeatureToggle 
                  icon={Activity} 
                  title="İzleyici Engelleyici" 
                  desc={privacyFeatures.trackerBlocker ? 'Tüm izleyiciler ve reklamlar engelleniyor' : 'Devre Dışı'}
                  isActive={privacyFeatures.trackerBlocker}
                  onClick={() => toggleFeature('trackerBlocker')}
                  isLight={isLight}
                />

                {/* HTTPS-Only */}
                <FeatureToggle 
                  icon={Lock} 
                  title="HTTPS-Only Modu" 
                  desc={privacyFeatures.httpsOnly ? 'Bağlantılar zorla şifreleniyor' : 'Bağlantılar şifresiz olabilir'}
                  isActive={privacyFeatures.httpsOnly}
                  onClick={() => toggleFeature('httpsOnly')}
                  isLight={isLight}
                />

                {/* Fingerprint Protection */}
                <FeatureToggle 
                  icon={Fingerprint} 
                  title="Parmak İzi Koruması" 
                  desc={privacyFeatures.fingerprintProtection ? 'Donanım verisi maskeleniyor' : 'Devre Dışı'}
                  isActive={privacyFeatures.fingerprintProtection}
                  onClick={() => toggleFeature('fingerprintProtection')}
                  isLight={isLight}
                />

                {/* Cookie Isolation */}
                <FeatureToggle 
                  icon={EyeOff} 
                  title="Çerez İzolasyonu" 
                  desc={privacyFeatures.cookieIsolation ? 'Siteler arası tam izolasyon' : 'Tüm çerezlere izin veriliyor'}
                  isActive={privacyFeatures.cookieIsolation}
                  onClick={() => toggleFeature('cookieIsolation')}
                  isLight={isLight}
                />
              </div>
            </motion.div>

            {/* Background Settings - Floating Island */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-6 rounded-3xl backdrop-blur-xl border shadow-glass ${isLight ? 'bg-white border-slate-200' : 'bg-bg-secondary/80 border-white/5'}`}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <ImageIcon size={20} className={isLight ? 'text-blue-500' : 'text-accent-blue'} /> Arka Plan
              </h2>
              
              <div className="space-y-5">
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Yeni sekme sayfası için özel bir arka plan resmi belirleyin.</p>

                {/* URL Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Resim URL'si (https://...)"
                    value={customBgInput}
                    onChange={e => setCustomBgInput(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:ring-2 ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-blue-100' 
                        : 'bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-accent-blue focus:ring-accent-blue/20'
                    }`}
                  />
                  <button 
                    onClick={handleApplyBg} 
                    className={`px-5 py-3 rounded-xl font-medium transition-all ${
                      isLight 
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' 
                        : 'bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                    }`}
                  >
                    Uygula
                  </button>
                </div>

                {/* File Upload */}
                <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  isLight ? 'border-slate-300 hover:border-blue-400 bg-slate-50' : 'border-white/20 hover:border-accent-blue/50 bg-black/20'
                }`}>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Dosya seç"
                  />
                  <div className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLight ? 'bg-blue-100 text-blue-500' : 'bg-white/5 text-gray-400'}`}>
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className={`font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Bilgisayardan Yükle</p>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Sürükleyip bırakın veya tıklayın (PNG, JPG, WEBP)</p>
                    </div>
                  </div>
                </div>

                {bgImage && (
                  <div className="pt-2 flex justify-between items-center">
                    <span className={`text-sm ${isLight ? 'text-green-600' : 'text-accent-green'}`}>✓ Özel arka plan aktif</span>
                    <button
                      onClick={() => { setBgImage(null); handleSave(); }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                        isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      <Trash2 size={12} /> Kaldır
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted Toggle Component for cleaner code
const FeatureToggle = ({ 
  icon: Icon, 
  title, 
  desc, 
  isActive, 
  onClick, 
  isLight 
}: { 
  icon: any, 
  title: string, 
  desc: string, 
  isActive: boolean, 
  onClick: () => void,
  isLight: boolean
}) => (
  <div className={`p-4 rounded-2xl border transition-colors flex items-center justify-between ${
    isLight 
      ? 'bg-slate-50 border-slate-200 hover:border-slate-300' 
      : 'bg-black/20 border-white/5 hover:border-white/10'
  }`}>
    <div className="flex items-start gap-4">
      <div className={`mt-0.5 p-2 rounded-lg ${
        isActive 
          ? (isLight ? 'bg-green-100 text-green-600' : 'bg-accent-green/20 text-accent-green') 
          : (isLight ? 'bg-slate-200 text-slate-400' : 'bg-white/5 text-gray-500')
      }`}>
        <Icon size={18} />
      </div>
      <div>
        <div className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{title}</div>
        <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{desc}</div>
      </div>
    </div>
    <button
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shadow-inner ${
        isActive 
          ? (isLight ? 'bg-green-500' : 'bg-accent-green shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]') 
          : (isLight ? 'bg-slate-300' : 'bg-white/20')
      }`}
    >
      <motion.div
        layout
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md`}
        initial={false}
        animate={{ 
          left: isActive ? '1.75rem' : '0.25rem',
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

export default SettingsPanel;
