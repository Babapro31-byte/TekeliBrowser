import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Image as ImageIcon,
  Layout,
  Lock,
  Plus,
  RotateCcw,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sidebar,
  X
} from 'lucide-react';

export type Tab = {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  isIncognito?: boolean;
  partition?: string;
};

type ActiveTab = 'settings' | 'web';
type ThemeId = 'neon' | 'zen' | 'cyberpunk' | 'terminal' | 'light';
type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'yellow' | 'rose' | 'cyan' | 'fuchsia' | 'orange';
type TabLayout = 'horizontal' | 'vertical';
type PrivacyLevel = 'off' | 'standard' | 'strict';

type ColorClass = {
  name: string;
  bg: string;
  accent: string;
  borderFull: string;
  borderHalf: string;
  borderLow: string;
  bgLow: string;
  bgMed: string;
  bgHigh: string;
  hover: string;
  shadowOuter: string;
  shadowInner: string;
  shadowGlow: string;
  lightAccent: string;
  lightBgLow: string;
  lightHover: string;
};

type ThemeDef = {
  id: ThemeId;
  name: string;
  desc: string;
  window: string;
  panel: string;
  hover: string;
  active: string;
  accent: string;
  border: string;
  input: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('settings');
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('neon');
  const [themeColor, setThemeColor] = useState<ThemeColor>('indigo');
  const [tabLayout, setTabLayout] = useState<TabLayout>('horizontal');
  const [showAddressBar, setShowAddressBar] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('strict');

  const [bgImage, setBgImage] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
  );
  const [customBgInput, setCustomBgInput] = useState('');
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const bootstrap = async () => {
      if (window.electron?.getTrackerBlockedCount) {
        try {
          const result = await window.electron.getTrackerBlockedCount();
          if (result && typeof result.count === 'number' && Number.isFinite(result.count)) {
            setBlockedCount(result.count);
          }
        } catch {}
      }
    };

    bootstrap();

    if (window.electron?.onTrackerBlocked) {
      cleanup = window.electron.onTrackerBlocked(() => {
        setBlockedCount(prev => prev + 1);
      });
    }

    return () => {
      cleanup?.();
    };
  }, []);

  const colorClasses: Record<ThemeColor, ColorClass> = {
    indigo: {
      name: 'Orijinal Mor',
      bg: 'bg-indigo-500',
      accent: 'text-indigo-400',
      borderFull: 'border-indigo-500',
      borderHalf: 'border-indigo-500/50',
      borderLow: 'border-indigo-500/30',
      bgLow: 'bg-indigo-500/10',
      bgMed: 'bg-indigo-500/20',
      bgHigh: 'bg-indigo-900/20',
      hover: 'hover:bg-indigo-500/20 hover:text-indigo-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]',
      lightAccent: 'text-indigo-600',
      lightBgLow: 'bg-indigo-50',
      lightHover: 'hover:bg-indigo-100 hover:text-indigo-700'
    },
    blue: {
      name: 'Okyanus Mavisi',
      bg: 'bg-blue-500',
      accent: 'text-blue-400',
      borderFull: 'border-blue-500',
      borderHalf: 'border-blue-500/50',
      borderLow: 'border-blue-500/30',
      bgLow: 'bg-blue-500/10',
      bgMed: 'bg-blue-500/20',
      bgHigh: 'bg-blue-900/20',
      hover: 'hover:bg-blue-500/20 hover:text-blue-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
      lightAccent: 'text-blue-600',
      lightBgLow: 'bg-blue-50',
      lightHover: 'hover:bg-blue-100 hover:text-blue-700'
    },
    emerald: {
      name: 'Zümrüt Yeşili',
      bg: 'bg-emerald-500',
      accent: 'text-emerald-400',
      borderFull: 'border-emerald-500',
      borderHalf: 'border-emerald-500/50',
      borderLow: 'border-emerald-500/30',
      bgLow: 'bg-emerald-500/10',
      bgMed: 'bg-emerald-500/20',
      bgHigh: 'bg-emerald-900/20',
      hover: 'hover:bg-emerald-500/20 hover:text-emerald-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      lightAccent: 'text-emerald-600',
      lightBgLow: 'bg-emerald-50',
      lightHover: 'hover:bg-emerald-100 hover:text-emerald-700'
    },
    yellow: {
      name: 'Siber Sarı',
      bg: 'bg-yellow-500',
      accent: 'text-yellow-400',
      borderFull: 'border-yellow-500',
      borderHalf: 'border-yellow-500/50',
      borderLow: 'border-yellow-500/30',
      bgLow: 'bg-yellow-500/10',
      bgMed: 'bg-yellow-500/20',
      bgHigh: 'bg-yellow-900/20',
      hover: 'hover:bg-yellow-500/20 hover:text-yellow-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
      lightAccent: 'text-yellow-600',
      lightBgLow: 'bg-yellow-50',
      lightHover: 'hover:bg-yellow-100 hover:text-yellow-700'
    },
    rose: {
      name: 'Kan Kırmızı',
      bg: 'bg-rose-500',
      accent: 'text-rose-400',
      borderFull: 'border-rose-500',
      borderHalf: 'border-rose-500/50',
      borderLow: 'border-rose-500/30',
      bgLow: 'bg-rose-500/10',
      bgMed: 'bg-rose-500/20',
      bgHigh: 'bg-rose-900/20',
      hover: 'hover:bg-rose-500/20 hover:text-rose-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(244,63,94,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
      lightAccent: 'text-rose-600',
      lightBgLow: 'bg-rose-50',
      lightHover: 'hover:bg-rose-100 hover:text-rose-700'
    },
    cyan: {
      name: 'Camgöbeği',
      bg: 'bg-cyan-500',
      accent: 'text-cyan-400',
      borderFull: 'border-cyan-500',
      borderHalf: 'border-cyan-500/50',
      borderLow: 'border-cyan-500/30',
      bgLow: 'bg-cyan-500/10',
      bgMed: 'bg-cyan-500/20',
      bgHigh: 'bg-cyan-900/20',
      hover: 'hover:bg-cyan-500/20 hover:text-cyan-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      lightAccent: 'text-cyan-600',
      lightBgLow: 'bg-cyan-50',
      lightHover: 'hover:bg-cyan-100 hover:text-cyan-700'
    },
    fuchsia: {
      name: 'Neon Pembe',
      bg: 'bg-fuchsia-500',
      accent: 'text-fuchsia-400',
      borderFull: 'border-fuchsia-500',
      borderHalf: 'border-fuchsia-500/50',
      borderLow: 'border-fuchsia-500/30',
      bgLow: 'bg-fuchsia-500/10',
      bgMed: 'bg-fuchsia-500/20',
      bgHigh: 'bg-fuchsia-900/20',
      hover: 'hover:bg-fuchsia-500/20 hover:text-fuchsia-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(217,70,239,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(217,70,239,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(217,70,239,0.3)]',
      lightAccent: 'text-fuchsia-600',
      lightBgLow: 'bg-fuchsia-50',
      lightHover: 'hover:bg-fuchsia-100 hover:text-fuchsia-700'
    },
    orange: {
      name: 'Alev Turuncusu',
      bg: 'bg-orange-500',
      accent: 'text-orange-400',
      borderFull: 'border-orange-500',
      borderHalf: 'border-orange-500/50',
      borderLow: 'border-orange-500/30',
      bgLow: 'bg-orange-500/10',
      bgMed: 'bg-orange-500/20',
      bgHigh: 'bg-orange-900/20',
      hover: 'hover:bg-orange-500/20 hover:text-orange-300',
      shadowOuter: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
      shadowInner: 'shadow-[inset_0_0_10px_rgba(249,115,22,0.2)]',
      shadowGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
      lightAccent: 'text-orange-600',
      lightBgLow: 'bg-orange-50',
      lightHover: 'hover:bg-orange-100 hover:text-orange-700'
    }
  };

  const activeColor = colorClasses[themeColor] || colorClasses.indigo;

  const themes: Record<ThemeId, ThemeDef> = {
    neon: {
      id: 'neon',
      name: 'Neon Glass',
      desc: 'Canlı renkler, bulanık arka plan.',
      window: `bg-slate-900/70 backdrop-blur-xl ${activeColor.borderLow} ${activeColor.shadowOuter} text-slate-200`,
      panel: `bg-slate-800/50 backdrop-blur-md ${activeColor.borderLow}`,
      hover: `${activeColor.hover} transition-all duration-300`,
      active: `${activeColor.accent} ${activeColor.borderFull} ${activeColor.shadowInner} ${activeColor.bgLow}`,
      accent: activeColor.accent,
      border: activeColor.borderLow,
      input: `bg-slate-900/50 ${activeColor.borderLow} focus-within:${activeColor.borderFull} focus-within:${activeColor.shadowGlow}`
    },
    zen: {
      id: 'zen',
      name: 'Zen / Libre',
      desc: 'Sıfır efekt, mat renkler, tam odak.',
      window: 'bg-zinc-950 border-zinc-800 shadow-2xl text-slate-200',
      panel: 'bg-zinc-900 border-zinc-800',
      hover: 'hover:bg-zinc-800 transition-none',
      active: 'text-zinc-100 border-zinc-500 bg-zinc-800',
      accent: 'text-zinc-400',
      border: 'border-zinc-800',
      input: 'bg-zinc-950 border-zinc-700 focus-within:border-zinc-500'
    },
    cyberpunk: {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      desc: 'Yüksek kontrast, renkli neon kenarlıklar.',
      window: `bg-yellow-950/80 backdrop-blur-md ${activeColor.borderHalf} shadow-[0_0_20px_rgba(0,0,0,0.5)] text-yellow-100`,
      panel: `bg-black/60 ${activeColor.borderLow}`,
      hover: `${activeColor.hover} transition-all`,
      active: `${activeColor.accent} ${activeColor.borderFull} ${activeColor.shadowGlow} ${activeColor.bgMed}`,
      accent: activeColor.accent,
      border: activeColor.borderHalf,
      input: `bg-black/50 ${activeColor.borderHalf} focus-within:${activeColor.borderFull} focus-within:${activeColor.shadowGlow}`
    },
    terminal: {
      id: 'terminal',
      name: 'Hacker Terminal',
      desc: 'Siyah zemin, monospaced font.',
      window: `bg-black ${activeColor.borderHalf} shadow-none ${activeColor.accent} font-mono`,
      panel: `bg-black ${activeColor.borderHalf}`,
      hover: `${activeColor.hover} transition-none`,
      active: `${activeColor.accent} ${activeColor.borderFull} ${activeColor.bgHigh}`,
      accent: activeColor.accent,
      border: activeColor.borderHalf,
      input: `bg-black ${activeColor.borderHalf} focus-within:${activeColor.borderFull}`
    },
    light: {
      id: 'light',
      name: 'Aydınlık Mod',
      desc: 'Gündüz kullanımı için ferah tasarım.',
      window: 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl text-slate-800',
      panel: 'bg-slate-50/80 backdrop-blur-md border-slate-200',
      hover: `${activeColor.lightHover} transition-all`,
      active: `${activeColor.lightAccent} ${activeColor.borderFull} ${activeColor.lightBgLow}`,
      accent: activeColor.lightAccent,
      border: 'border-slate-200',
      input: `bg-white border-slate-300 focus-within:${activeColor.borderFull} focus-within:${activeColor.shadowGlow}`
    }
  };

  const t = themes[activeThemeId] || themes.neon;

  const handleApplyBg = () => {
    if (customBgInput.trim()) {
      setBgImage(customBgInput);
      setCustomBgInput('');
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center p-8 flex items-center justify-center font-sans transition-all duration-700"
      style={{ backgroundImage: `url('${bgImage}')` }}
    >
      <div className={`w-full max-w-6xl h-[85vh] rounded-xl flex flex-col overflow-hidden transition-all duration-500 border ${t.window}`}>
        <div className={`h-10 flex items-center px-4 flex-shrink-0 select-none border-b ${t.border} ${activeThemeId === 'light' ? 'bg-white/50' : 'bg-black/20'}`}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"></div>
          </div>
          <div className="mx-auto text-xs font-semibold tracking-widest flex items-center gap-2 opacity-70">
            <Shield size={14} className={t.accent} />
            TEKELIBROWSER
          </div>
        </div>

        <div className={`flex flex-1 overflow-hidden ${tabLayout === 'vertical' ? 'flex-row' : 'flex-col'}`}>
          <div
            className={`flex p-2 gap-2 overflow-x-auto custom-scrollbar border-b ${t.border} ${activeThemeId === 'light' ? 'bg-slate-100/50' : 'bg-black/30'} ${tabLayout === 'vertical' ? 'flex-col w-48 border-r border-b-0' : 'flex-row items-end h-12 relative'}`}
          >
            <div
              onClick={() => setActiveTab('settings')}
              className={`flex items-center justify-center px-3 py-2 rounded-md text-sm cursor-pointer border ${activeTab === 'settings' ? t.active : `border-transparent opacity-70 ${t.hover}`} ${tabLayout === 'vertical' ? 'gap-2' : 'sticky left-0 z-10 w-10'} ${activeThemeId === 'light' ? 'bg-slate-100' : 'bg-black/40 backdrop-blur-md'}`}
              title="Kişiselleştirme ve Ayarlar"
            >
              <Settings size={16} className={activeTab === 'settings' ? t.accent : ''} />
              {tabLayout === 'vertical' && <span className="truncate flex-1 font-medium">Ayarlar</span>}
            </div>

            {tabLayout === 'vertical' && <div className={`my-1 border-b ${t.border} opacity-50`}></div>}

            <div
              onClick={() => setActiveTab('web')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer border ${activeTab === 'web' ? t.active : `border-transparent opacity-70 ${t.hover}`} ${tabLayout === 'vertical' ? '' : 'min-w-[150px]'}`}
            >
              <Globe size={14} className={activeTab === 'web' ? t.accent : ''} />
              <span className="truncate flex-1">Yeni Sekme</span>
              <X size={14} className="opacity-50 hover:opacity-100" />
            </div>

            <button className={`p-2 rounded-md border border-transparent opacity-70 ${t.hover}`}>
              <Plus size={16} />
            </button>
          </div>

          <div className={`flex flex-col flex-1 overflow-hidden ${activeThemeId === 'light' ? 'bg-white/40' : 'bg-black/40'}`}>
            {showAddressBar && (
              <div className={`flex items-center p-2 gap-2 border-b ${t.border} ${activeThemeId === 'light' ? 'bg-white/60' : 'bg-black/20'}`}>
                <div className="flex gap-1">
                  <button className={`p-2 rounded-md opacity-70 ${t.hover}`}>
                    <ArrowLeft size={16} />
                  </button>
                  <button className="p-2 rounded-md opacity-30 cursor-not-allowed">
                    <ArrowRight size={16} />
                  </button>
                  <button className={`p-2 rounded-md opacity-70 ${t.hover}`}>
                    <RotateCcw size={16} />
                  </button>
                </div>

                <div className={`flex-1 flex items-center px-4 py-1.5 rounded-full border transition-all ${t.input}`}>
                  <Shield size={14} className={`${t.accent} mr-2`} />
                  <span className="opacity-50 text-sm">tekeli://</span>
                  <input
                    type="text"
                    value={activeTab === 'settings' ? 'ayarlar/kisisellestirme' : 'duckduckgo.com'}
                    readOnly
                    className="bg-transparent border-none outline-none text-sm flex-1 ml-1 text-inherit font-inherit"
                  />
                  {privacyLevel !== 'off' && (
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${t.border} ${t.accent}`}>
                      {privacyLevel === 'strict' ? 'Kapsamlı Koruma' : 'Ortalama Koruma'}
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  <button className={`p-2 rounded-md ${showSidebar ? t.accent : 'opacity-70'} ${t.hover}`} onClick={() => setShowSidebar(!showSidebar)}>
                    <Sidebar size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
              {activeTab === 'settings' ? (
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                      <Layout size={32} className={t.accent} />
                      Tarayıcını Şekillendir
                    </h1>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className={`p-6 rounded-xl border ${t.panel}`}>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Eye size={20} className={t.accent} /> Görünüm Teması
                        </h2>
                        <div className="space-y-3">
                          {Object.values(themes).map(themeObj => (
                            <div key={themeObj.id}>
                              <label
                                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer border ${activeThemeId === themeObj.id ? t.active : `border-transparent opacity-80 ${t.hover}`}`}
                                onClick={() => setActiveThemeId(themeObj.id)}
                              >
                                <div>
                                  <div className="font-semibold">{themeObj.name}</div>
                                  <div className="text-sm opacity-70">{themeObj.desc}</div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${activeThemeId === themeObj.id ? 'border-current bg-current' : 'border-current opacity-50'}`}></div>
                              </label>

                              {themeObj.id !== 'zen' && activeThemeId === themeObj.id && (
                                <div className={`mt-2 ml-4 p-3 rounded-lg flex flex-wrap gap-3 border ${t.border} ${activeThemeId === 'light' ? 'bg-slate-100/50' : 'bg-black/20'}`}>
                                  {(Object.keys(colorClasses) as ThemeColor[]).map(colorKey => (
                                    <button
                                      key={colorKey}
                                      onClick={() => setThemeColor(colorKey)}
                                      title={colorClasses[colorKey].name}
                                      className={`w-6 h-6 rounded-full transition-transform ${colorClasses[colorKey].bg} ${themeColor === colorKey ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-transparent' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                                    ></button>
                                  ))}
                                  <span className="text-xs ml-auto my-auto opacity-70">Vurgu Rengi</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className={`p-6 rounded-xl border ${t.panel}`}>
                          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <ImageIcon size={20} className={t.accent} /> Kişisel Arka Plan
                          </h2>
                          <div className="space-y-4">
                            <p className="text-sm opacity-70">Tarayıcının arkasında kendi görselini göster. Resim URL&apos;si yapıştırın.</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder=" `https://...` "
                                value={customBgInput}
                                onChange={e => setCustomBgInput(e.target.value)}
                                className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${t.input}`}
                              />
                              <button onClick={handleApplyBg} className={`px-4 py-2 rounded-lg border font-medium ${t.border} ${t.hover}`}>
                                Uygula
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className={`p-6 rounded-xl border ${t.panel}`}>
                          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Layout size={20} className={t.accent} /> Modüler Düzen
                          </h2>
                          <div className="space-y-5">
                            <div>
                              <div className="text-sm opacity-70 mb-2">Sekme Konumu</div>
                              <div className={`flex p-1 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-slate-100' : 'bg-black/40'}`}>
                                <button
                                  className={`flex-1 py-2 text-sm rounded-md transition-all ${tabLayout === 'horizontal' ? t.active : `opacity-70 ${t.hover}`}`}
                                  onClick={() => setTabLayout('horizontal')}
                                >
                                  Yatay (Üstte)
                                </button>
                                <button
                                  className={`flex-1 py-2 text-sm rounded-md transition-all ${tabLayout === 'vertical' ? t.active : `opacity-70 ${t.hover}`}`}
                                  onClick={() => setTabLayout('vertical')}
                                >
                                  Dikey (Solda)
                                </button>
                              </div>
                            </div>
                            <div className={`pt-4 border-t flex items-center justify-between ${t.border}`}>
                              <div>
                                <div className="font-semibold">Adres Çubuğunu Göster</div>
                                <div className="text-xs opacity-70">Gizlersen Cmd+L ile açılır.</div>
                              </div>
                              <button
                                className={`w-12 h-6 rounded-full transition-colors relative ${showAddressBar ? t.accent.replace('text', 'bg') : 'bg-slate-500/50'}`}
                                onClick={() => setShowAddressBar(!showAddressBar)}
                              >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${showAddressBar ? 'left-7' : 'left-1'}`}></div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center relative">
                  <div className={`absolute inset-0 ${activeThemeId === 'light' ? 'bg-white/60' : 'bg-black/60'} backdrop-blur-sm`}></div>
                  <div className="z-10 text-center">
                    <Globe size={48} className={`mx-auto mb-4 opacity-50 ${t.accent}`} />
                    <h2 className="text-2xl font-bold mb-2">DuckDuckGo</h2>
                    <p className="text-sm opacity-70">Arama motoru ve gizlilik koruması aktif.</p>
                  </div>
                </div>
              )}

              {showSidebar && (
                <div className={`w-72 border-l p-4 flex flex-col ${t.panel} ${t.border} relative z-10 overflow-y-auto custom-scrollbar`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-semibold flex items-center gap-2 ${t.accent}`}>
                      {privacyLevel === 'off' ? <ShieldAlert size={18} className="text-red-500" /> : <ShieldCheck size={18} />} Gizlilik Kalkanı
                    </h3>
                    <button className={`p-1 rounded-md opacity-70 ${t.hover}`} onClick={() => setShowSidebar(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="mb-6">
                    <div className="text-xs opacity-60 uppercase tracking-wider mb-2 font-semibold">Koruma Seviyesi</div>
                    <div className={`flex p-1 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-slate-100/50' : 'bg-black/40'}`}>
                      <button
                        onClick={() => setPrivacyLevel('off')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${privacyLevel === 'off' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : `opacity-60 ${t.hover}`}`}
                      >
                        Kapalı
                      </button>
                      <button
                        onClick={() => setPrivacyLevel('standard')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${privacyLevel === 'standard' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : `opacity-60 ${t.hover}`}`}
                      >
                        Ortalama
                      </button>
                      <button
                        onClick={() => setPrivacyLevel('strict')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${privacyLevel === 'strict' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : `opacity-60 ${t.hover}`}`}
                      >
                        Kapsamlı
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/60' : 'bg-black/20'}`}>
                      <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1">Engellenen</div>
                      <div className={`text-xl font-bold ${privacyLevel === 'off' ? 'text-red-500 opacity-50' : 'text-green-500'}`}>
                        {privacyLevel === 'off' ? '0' : blockedCount.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/60' : 'bg-black/20'}`}>
                      <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1">Tasarruf</div>
                      <div className={`text-xl font-bold ${privacyLevel === 'off' ? 'opacity-50' : t.accent}`}>{privacyLevel === 'off' ? '0 MB' : '42 MB'}</div>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="text-xs opacity-60 uppercase tracking-wider mb-2 font-semibold">Aktif Modüller</div>
                    <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/40' : 'bg-black/20'} flex items-start gap-3`}>
                      <Activity
                        size={16}
                        className={`mt-0.5 ${privacyLevel === 'off' ? 'text-red-500' : privacyLevel === 'standard' ? 'text-yellow-500' : 'text-green-500'}`}
                      />
                      <div>
                        <div className="text-sm font-medium">İzleyici Engelleyici</div>
                        <div className="text-xs opacity-60 mt-0.5">{privacyLevel === 'off' ? 'Devre Dışı' : privacyLevel === 'standard' ? 'Sadece Bilinen İzleyiciler' : 'Tüm İzleyiciler ve Reklamlar'}</div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/40' : 'bg-black/20'} flex items-start gap-3`}>
                      <Lock size={16} className={`mt-0.5 ${privacyLevel === 'off' ? 'text-red-500' : 'text-green-500'}`} />
                      <div>
                        <div className="text-sm font-medium">HTTPS-Only Modu</div>
                        <div className="text-xs opacity-60 mt-0.5">{privacyLevel === 'off' ? 'Bağlantılar şifresiz olabilir' : 'Bağlantılar zorla şifreleniyor'}</div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/40' : 'bg-black/20'} flex items-start gap-3`}>
                      <Fingerprint size={16} className={`mt-0.5 ${privacyLevel === 'strict' ? 'text-green-500' : 'text-red-500 opacity-50'}`} />
                      <div>
                        <div className="text-sm font-medium">Parmak İzi Koruması</div>
                        <div className="text-xs opacity-60 mt-0.5">{privacyLevel === 'strict' ? 'Donanım verisi maskeleniyor' : 'Devre Dışı'}</div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/40' : 'bg-black/20'} flex items-start gap-3`}>
                      <EyeOff
                        size={16}
                        className={`mt-0.5 ${privacyLevel === 'off' ? 'text-red-500' : privacyLevel === 'standard' ? 'text-yellow-500' : 'text-green-500'}`}
                      />
                      <div>
                        <div className="text-sm font-medium">Çerez İzolasyonu</div>
                        <div className="text-xs opacity-60 mt-0.5">{privacyLevel === 'off' ? 'Tüm çerezlere izin veriliyor' : privacyLevel === 'standard' ? '3. Parti çerezler engelleniyor' : 'Siteler arası tam izolasyon'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
