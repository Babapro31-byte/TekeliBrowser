import { useState, useEffect, useCallback } from 'react';
import type { SearchEngine } from '../types/electron';
import { applyTheme, type ThemeId, type AccentId } from '../utils/theme';

interface SettingsPanelProps {
  initialSection?: string;
}

type CookiePolicy = 'all' | 'block-third-party' | 'block-all';

const PERMISSION_LABELS: Record<string, string> = {
  media: 'Kamera / Mikrofon',
  microphone: 'Mikrofon',
  camera: 'Kamera',
  geolocation: 'Konum',
  notifications: 'Bildirimler',
};

const SECTIONS = [
  { id: 'general', label: 'Genel', icon: 'tune' },
  { id: 'privacy', label: 'Gizlilik & Güvenlik', icon: 'shield' },
  { id: 'appearance', label: 'Görünüm', icon: 'palette' },
  { id: 'about', label: 'Hakkında & Kısayollar', icon: 'info' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

function isValidSection(s: string | undefined): s is SectionId {
  return SECTIONS.some(sec => sec.id === s);
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-outline/40'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-background shadow transition-all duration-200 ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-[0.14em] mb-3 mt-7 first:mt-0">
      {title}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline/10 px-4 divide-y divide-outline/10">
      {children}
    </div>
  );
}

const THEMES: { id: ThemeId; label: string; icon: string }[] = [
  { id: 'dark', label: 'Koyu', icon: 'dark_mode' },
  { id: 'light', label: 'Açık', icon: 'light_mode' },
  { id: 'oled', label: 'OLED', icon: 'contrast' },
];

const ACCENTS: { id: AccentId; label: string; hex: string }[] = [
  { id: 'neutral', label: 'Nötr', hex: '#c6c6cf' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'indigo', label: 'İndigo', hex: '#818cf8' },
  { id: 'emerald', label: 'Zümrüt', hex: '#34d399' },
  { id: 'rose', label: 'Gül', hex: '#fb7185' },
];

const SHORTCUTS = [
  { label: 'Yeni Sekme', keys: 'Ctrl+T' },
  { label: 'Sekmeyi Kapat', keys: 'Ctrl+W' },
  { label: 'Geri', keys: 'Alt+Sol' },
  { label: 'İleri', keys: 'Alt+Sağ' },
  { label: 'Yenile', keys: 'Ctrl+R' },
  { label: 'Adres Çubuğu', keys: 'Ctrl+L' },
  { label: 'Geçmiş', keys: 'Ctrl+H' },
  { label: 'Kapalı Sekmeyi Aç', keys: 'Ctrl+Shift+T' },
  { label: 'Sonraki Sekme', keys: 'Ctrl+Sekme' },
  { label: 'Önceki Sekme', keys: 'Ctrl+Shift+Sekme' },
];

const SettingsPanel = ({ initialSection }: SettingsPanelProps) => {
  const [activeSection, setActiveSection] = useState<SectionId>(
    isValidSection(initialSection) ? initialSection : 'general'
  );

  useEffect(() => {
    if (isValidSection(initialSection)) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // General
  const [searchEngine, setSearchEngineState] = useState<SearchEngine>('duckduckgo');
  const [restoreSession, setRestoreSession] = useState(false);
  const [defaultZoom, setDefaultZoom] = useState(100);

  // Privacy
  const [trackerBlocking, setTrackerBlocking] = useState(true);
  const [cookiePolicy, setCookiePolicyState] = useState<CookiePolicy>('all');
  const [sitePermissions, setSitePermissions] = useState<Record<string, Record<string, 'allow' | 'block'>>>({});
  const [historyCleared, setHistoryCleared] = useState(false);

  // Appearance
  const [theme, setThemeState] = useState<ThemeId>('dark');
  const [accent, setAccentState] = useState<AccentId>('neutral');
  const [reducedMotion, setReducedMotionState] = useState(false);

  const loadSettings = useCallback(async () => {
    setRestoreSession(localStorage.getItem('tekeli:restoreSession') === 'true');
    const storedZoom = localStorage.getItem('tekeli:defaultZoom');
    if (storedZoom) {
      const z = Math.round(parseFloat(storedZoom) * 100);
      if (z >= 80 && z <= 200) setDefaultZoom(z);
    }
    setThemeState((localStorage.getItem('tekeli:theme') || 'dark') as ThemeId);
    setAccentState((localStorage.getItem('tekeli:accent') || 'neutral') as AccentId);
    setReducedMotionState(localStorage.getItem('tekeli:reducedMotion') === 'true');

    try {
      const [searchRes, trackerRes, cookieRes, permsRes] = await Promise.all([
        window.electron?.getSearchEngine?.(),
        window.electron?.getTrackerBlocking?.(),
        window.electron?.getCookiePolicy?.(),
        window.electron?.getAllPermissions?.(),
      ]);
      if (searchRes?.engine) setSearchEngineState(searchRes.engine as SearchEngine);
      if (trackerRes?.enabled !== undefined) setTrackerBlocking(trackerRes.enabled);
      if (cookieRes?.policy) setCookiePolicyState(cookieRes.policy as CookiePolicy);
      if (permsRes) setSitePermissions(permsRes);
    } catch (err) {
      console.error('[SettingsPanel] Load failed:', err);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSearchEngineChange = async (engine: SearchEngine) => {
    try {
      await window.electron?.setSearchEngine?.(engine);
      setSearchEngineState(engine);
    } catch (err) {
      console.error('[SettingsPanel] Search engine change failed:', err);
    }
  };

  const handleTrackerToggle = async (enabled: boolean) => {
    try {
      await window.electron?.setTrackerBlocking?.(enabled);
      setTrackerBlocking(enabled);
    } catch (err) {
      console.error('[SettingsPanel] Tracker toggle failed:', err);
    }
  };

  const handleCookiePolicyChange = async (policy: CookiePolicy) => {
    try {
      await window.electron?.setCookiePolicy?.(policy);
      setCookiePolicyState(policy);
    } catch (err) {
      console.error('[SettingsPanel] Cookie policy change failed:', err);
    }
  };

  const handleClearPermissions = async (site?: string) => {
    try {
      await window.electron?.clearSitePermission?.(site);
      if (site) {
        setSitePermissions(prev => {
          const next = { ...prev };
          delete next[site];
          return next;
        });
      } else {
        setSitePermissions({});
      }
    } catch (err) {
      console.error('[SettingsPanel] Clear permissions failed:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await window.electron?.clearHistory?.();
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 3000);
    } catch (err) {
      console.error('[SettingsPanel] Clear history failed:', err);
    }
  };

  const handleThemeChange = (newTheme: ThemeId) => {
    applyTheme(newTheme, accent);
    setThemeState(newTheme);
  };

  const handleAccentChange = (newAccent: AccentId) => {
    applyTheme(theme, newAccent);
    setAccentState(newAccent);
  };

  const handleReducedMotionChange = (enabled: boolean) => {
    localStorage.setItem('tekeli:reducedMotion', String(enabled));
    if (enabled) {
      document.documentElement.dataset.reducedMotion = 'true';
    } else {
      delete document.documentElement.dataset.reducedMotion;
    }
    setReducedMotionState(enabled);
  };

  const sites = Object.entries(sitePermissions);

  const renderGeneral = () => (
    <>
      <SectionHeader title="Arama Motoru" />
      <Card>
        {(['duckduckgo', 'google'] as const).map(engine => (
          <SettingRow
            key={engine}
            label={engine === 'duckduckgo' ? 'DuckDuckGo' : 'Google'}
            description={engine === 'duckduckgo' ? 'Gizlilik odaklı' : 'En popüler arama motoru'}
          >
            <input
              type="radio"
              name="searchEngine"
              checked={searchEngine === engine}
              onChange={() => handleSearchEngineChange(engine)}
              className="w-4 h-4 accent-current text-primary cursor-pointer"
              aria-label={engine === 'duckduckgo' ? 'DuckDuckGo seç' : 'Google seç'}
            />
          </SettingRow>
        ))}
      </Card>

      <SectionHeader title="Başlangıç" />
      <Card>
        <SettingRow
          label="Önceki sekmeleri geri yükle"
          description="Kapandığında açık sekmeleri hatırla"
        >
          <Toggle
            checked={restoreSession}
            onChange={(enabled) => {
              localStorage.setItem('tekeli:restoreSession', String(enabled));
              setRestoreSession(enabled);
            }}
          />
        </SettingRow>
      </Card>

      <SectionHeader title="Görüntü" />
      <Card>
        <SettingRow
          label="Varsayılan Zoom"
          description={`Yeni sayfalar için başlangıç zoom seviyesi: %${defaultZoom}`}
        >
          <select
            value={defaultZoom}
            onChange={(e) => {
              const z = Number(e.target.value);
              localStorage.setItem('tekeli:defaultZoom', String(z / 100));
              setDefaultZoom(z);
            }}
            className="bg-surface-container-high text-on-surface text-sm rounded-md px-2 py-1 border border-outline/20 cursor-pointer"
            aria-label="Varsayılan zoom seviyesi"
          >
            {[80, 90, 100, 110, 125, 150].map(z => (
              <option key={z} value={z}>%{z}</option>
            ))}
          </select>
        </SettingRow>
      </Card>
    </>
  );

  const renderPrivacy = () => (
    <>
      <SectionHeader title="Gizlilik" />
      <Card>
        <SettingRow
          label="İzleyici Engelleme"
          description="Tracker ve reklam izleyicilerini engelle"
        >
          <Toggle checked={trackerBlocking} onChange={handleTrackerToggle} />
        </SettingRow>
      </Card>

      <SectionHeader title="Çerez Politikası" />
      <Card>
        {([
          { value: 'all' as CookiePolicy, label: 'Tüm çerezler', desc: 'Tüm çerezlere izin ver' },
          { value: 'block-third-party' as CookiePolicy, label: '3. taraf çerezleri engelle', desc: 'Reklam izlemeyi engeller' },
          { value: 'block-all' as CookiePolicy, label: 'Tüm çerezleri engelle', desc: 'En yüksek gizlilik' },
        ]).map(({ value, label, desc }) => (
          <SettingRow key={value} label={label} description={desc}>
            <input
              type="radio"
              name="cookiePolicy"
              checked={cookiePolicy === value}
              onChange={() => handleCookiePolicyChange(value)}
              className="w-4 h-4 accent-current text-primary cursor-pointer"
              aria-label={label}
            />
          </SettingRow>
        ))}
      </Card>

      <SectionHeader title="Site İzinleri" />
      <Card>
        {sites.length === 0 ? (
          <div className="py-4 text-sm text-on-surface-variant text-center">Henüz site izni verilmedi</div>
        ) : (
          <>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-on-surface-variant">{sites.length} site kaydedilmiş</span>
              <button
                onClick={() => handleClearPermissions()}
                className="text-xs text-error hover:text-error/80 transition-colors cursor-pointer"
              >
                Tümünü temizle
              </button>
            </div>
            {sites.map(([site, perms]) => (
              <div key={site} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary truncate max-w-[60%]">{site}</span>
                  <button
                    onClick={() => handleClearPermissions(site)}
                    className="text-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                  >
                    Kaldır
                  </button>
                </div>
                {Object.entries(perms).map(([perm, decision]) => (
                  <div key={perm} className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${decision === 'allow' ? 'bg-primary' : 'bg-error'}`}
                      aria-hidden="true"
                    />
                    {PERMISSION_LABELS[perm] || perm}: {decision === 'allow' ? 'İzin verildi' : 'Engellendi'}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </Card>

      <SectionHeader title="Gezinti Geçmişi" />
      <Card>
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Geçmişi temizle</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Tüm ziyaret geçmişini sil</p>
          </div>
          <button
            onClick={handleClearHistory}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              historyCleared
                ? 'border-primary/30 text-primary bg-primary/10'
                : 'border-error/40 text-error hover:bg-error/10'
            }`}
          >
            {historyCleared ? 'Temizlendi' : 'Temizle'}
          </button>
        </div>
      </Card>
    </>
  );

  const renderAppearance = () => (
    <>
      <SectionHeader title="Tema" />
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => handleThemeChange(t.id)}
            aria-pressed={theme === t.id}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
              theme === t.id
                ? 'border-primary/60 bg-primary-container/30'
                : 'border-outline/15 bg-surface-container-low hover:bg-surface-container-high'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${theme === t.id ? 'text-primary' : 'text-secondary'}`}
              aria-hidden="true"
            >
              {t.icon}
            </span>
            <span className={`text-xs font-medium ${theme === t.id ? 'text-primary' : 'text-secondary'}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <SectionHeader title="Vurgu Rengi" />
      <div className="flex items-center gap-4 flex-wrap">
        {ACCENTS.map(a => (
          <button
            key={a.id}
            onClick={() => handleAccentChange(a.id)}
            aria-pressed={accent === a.id}
            aria-label={a.label}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                accent === a.id
                  ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                  : 'group-hover:scale-105'
              }`}
              style={{ backgroundColor: a.hex }}
            >
              {accent === a.id && (
                <span className="material-symbols-outlined text-[16px] text-background" aria-hidden="true">
                  check
                </span>
              )}
            </div>
            <span className="text-[10px] text-on-surface-variant">{a.label}</span>
          </button>
        ))}
      </div>

      <SectionHeader title="Erişilebilirlik" />
      <Card>
        <SettingRow
          label="Hareketi azalt"
          description="Animasyonları ve geçişleri kısalt"
        >
          <Toggle checked={reducedMotion} onChange={handleReducedMotionChange} />
        </SettingRow>
      </Card>
    </>
  );

  const renderAbout = () => (
    <>
      <SectionHeader title="Uygulama" />
      <Card>
        <div className="py-4 flex items-start gap-4">
          <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center rounded-xl border border-outline/15 flex-shrink-0">
            <img
              src="/logo.svg"
              alt="Tekeli logosu"
              className="w-8 h-8 object-contain grayscale invert brightness-200"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">TekeliBrowser</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Sürüm 3.0.1</p>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Gelişmiş gizlilik ve performans odaklı masaüstü tarayıcı.
            </p>
          </div>
        </div>
      </Card>

      <SectionHeader title="Klavye Kısayolları" />
      <Card>
        {SHORTCUTS.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-on-surface-variant">{s.label}</span>
            <kbd className="text-xs font-mono text-primary bg-surface-container-high px-2 py-0.5 rounded-md border border-outline/15">
              {s.keys}
            </kbd>
          </div>
        ))}
      </Card>
    </>
  );

  return (
    <div className="w-full h-full flex bg-background text-on-surface overflow-hidden">
      <nav
        className="w-48 h-full flex-shrink-0 border-r border-outline/10 bg-surface-container-low flex flex-col pt-6"
        aria-label="Ayarlar bölümleri"
      >
        <div className="px-4 mb-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant font-medium">Ayarlar</p>
        </div>
        <ul className="flex flex-col gap-0.5 px-3" role="list">
          {SECTIONS.map(s => (
            <li key={s.id}>
              <button
                onClick={() => setActiveSection(s.id)}
                aria-current={activeSection === s.id ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-primary-container/40 text-on-primary-container font-medium'
                    : 'text-secondary hover:text-primary hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  {s.icon}
                </span>
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-xl">
          <h1 className="text-base font-bold text-on-surface tracking-tight mb-6">
            {SECTIONS.find(s => s.id === activeSection)?.label}
          </h1>
          {activeSection === 'general' && renderGeneral()}
          {activeSection === 'privacy' && renderPrivacy()}
          {activeSection === 'appearance' && renderAppearance()}
          {activeSection === 'about' && renderAbout()}
        </div>
      </main>
    </div>
  );
};

export default SettingsPanel;
