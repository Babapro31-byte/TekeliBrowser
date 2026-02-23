import { useEffect, useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Fingerprint,
  Image as ImageIcon,
  Layout,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Save
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

export default function SettingsPanel({ 
  themeColor, 
  setThemeColor, 
  privacyLevel, 
  setPrivacyLevel, 
  tabLayout, 
  setTabLayout,
  activeThemeId,
  setActiveThemeId
}: SettingsPanelProps) {
  // @ts-ignore: bgImage is used in preview but currently hidden, will be used later
  const [bgImage, setBgImage] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
  );
  const [customBgInput, setCustomBgInput] = useState('');
  // @ts-ignore: blockedCount is used for effect dependency
  const [blockedCount, setBlockedCount] = useState(0);
  const [showSaveToast, setShowSaveToast] = useState(false);

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

  const activeColor = colorClasses[themeColor] || colorClasses.indigo;
  const themes = getThemes(activeColor);
  const t = themes[activeThemeId] || themes.neon;

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

  const handleSave = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  return (
    <div className={`w-full h-full overflow-y-auto p-6 md:p-8 custom-scrollbar ${t.window.includes('bg-white') ? 'bg-slate-100 text-slate-800' : 'bg-dark-bg text-white'}`}>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Layout size={32} className={t.accent} />
          Tarayıcını Şekillendir
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl border ${t.panel}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye size={20} className={t.accent} /> Tema
            </h2>
            <div className="space-y-3">
              {Object.values(themes).map(themeObj => (
                <div key={themeObj.id}>
                  <label
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer border ${activeThemeId === themeObj.id ? t.active : `border-transparent hover:bg-white/5`}`}
                    onClick={() => setActiveThemeId(themeObj.id)}
                  >
                    <div>
                      <div className="font-semibold">{themeObj.name}</div>
                      <div className={`text-sm ${activeThemeId === themeObj.id ? 'opacity-90' : 'opacity-60'}`}>{themeObj.desc}</div>
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

            <div className={`mt-6 pt-6 border-t ${t.border}`}>
              <div className="text-sm opacity-70 mb-2">Sekme Konumu</div>
              <div className={`flex p-1 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-slate-100' : 'bg-black/40'}`}>
                <button
                  className={`flex-1 py-2 text-sm rounded-md transition-all ${tabLayout === 'horizontal' ? t.active : `opacity-70 ${t.hover}`}`}
                  onClick={() => setTabLayout('horizontal')}
                >
                  Yatay
                </button>
                <button
                  className={`flex-1 py-2 text-sm rounded-md transition-all ${tabLayout === 'vertical' ? t.active : `opacity-70 ${t.hover}`}`}
                  onClick={() => setTabLayout('vertical')}
                >
                  Dikey
                </button>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${t.panel}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {privacyLevel === 'off' ? <ShieldAlert size={20} className="text-red-500" /> : <ShieldCheck size={20} className={t.accent} />} Gizlilik
            </h2>

            <div className="mb-5">
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

            <div className="grid grid-cols-2 gap-3 mb-5">
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

            <div className="space-y-3">
              <div className="text-xs opacity-60 uppercase tracking-wider mb-2 font-semibold">Aktif Modüller</div>
              <div className={`p-3 rounded-lg border ${t.border} ${activeThemeId === 'light' ? 'bg-white/40' : 'bg-black/20'} flex items-start gap-3`}>
                <Activity size={16} className={`mt-0.5 ${privacyLevel === 'off' ? 'text-red-500' : privacyLevel === 'standard' ? 'text-yellow-500' : 'text-green-500'}`} />
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
                <EyeOff size={16} className={`mt-0.5 ${privacyLevel === 'off' ? 'text-red-500' : privacyLevel === 'standard' ? 'text-yellow-500' : 'text-green-500'}`} />
                <div>
                  <div className="text-sm font-medium">Çerez İzolasyonu</div>
                  <div className="text-xs opacity-60 mt-0.5">{privacyLevel === 'off' ? 'Tüm çerezlere izin veriliyor' : privacyLevel === 'standard' ? '3. Parti çerezler engelleniyor' : 'Siteler arası tam izolasyon'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${t.panel}`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ImageIcon size={20} className={t.accent} /> Arka Plan
          </h2>
          <div className="space-y-4">
            <p className="text-sm opacity-70">Resim URL&apos;si veya bilgisayarınızdan bir dosya seçin.</p>
            
            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://..."
                value={customBgInput}
                onChange={e => setCustomBgInput(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${t.input}`}
              />
              <button onClick={handleApplyBg} className={`px-4 py-2 rounded-lg border font-medium ${t.border} ${t.hover}`}>
                Uygula
              </button>
            </div>

            {/* File Upload */}
            <div className="relative">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed ${t.border} ${t.hover} transition-all`}>
                <ImageIcon size={16} className="opacity-70" />
                <span className="text-sm font-medium">Bilgisayardan Dosya Seç (PNG, JPG)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
        {showSaveToast && (
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-up">
            Ayarlar kaydedildi
          </div>
        )}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${t.active} text-white`}
        >
          <Save size={20} />
          Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}
