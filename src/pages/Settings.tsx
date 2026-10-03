import { Check, Info, Keyboard, KeyRound, Moon, Palette, RefreshCw, ShieldCheck, SlidersHorizontal, Sun, Trash2, Contrast, Monitor, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { AccentId, Settings as SettingsType, ThemeSetting } from '../../shared/settings';
import type { MessageKey } from '../../shared/i18n';
import { boot, updateSettings, useSettings, useT } from '../lib/bridge';
import { Button, Group, IconButton, PageHeader, Row, Segmented, Select, Toggle, cx } from '../lib/ui';
import { DataSection } from './settings/DataSection';
import { Passwords } from './settings/Passwords';
import { Updates } from './settings/Updates';

type Section = 'general' | 'privacy' | 'appearance' | 'passwords' | 'updates' | 'shortcuts' | 'about';
const NAV: { id: Section; label: MessageKey; icon: LucideIcon }[] = [
  { id: 'general', label: 'settings.general', icon: SlidersHorizontal },
  { id: 'privacy', label: 'settings.privacy', icon: ShieldCheck },
  { id: 'appearance', label: 'settings.appearance', icon: Palette },
  { id: 'passwords', label: 'settings.passwords', icon: KeyRound },
  { id: 'updates', label: 'settings.updates', icon: RefreshCw },
  { id: 'shortcuts', label: 'settings.shortcuts', icon: Keyboard },
  { id: 'about', label: 'settings.about', icon: Info },
];

const sectionFromPath = (): Section => {
  const seg = location.protocol === 'tekeli:' ? location.pathname.split('/').filter(Boolean)[0] : new URLSearchParams(location.search).get('section');
  return NAV.some((n) => n.id === seg) ? (seg as Section) : 'general';
};

// ---------- sections ----------
function General({ s }: { s: SettingsType }) {
  const t = useT();
  return (
    <>
      <PageHeader title={t('settings.general')} desc={t('general.desc')} />
      <Group>
        <Row title={t('general.searchEngine')} desc={t('general.searchEngine.desc')}>
          <Select label={t('general.searchEngine')} value={s.searchEngine} onChange={(v) => void updateSettings({ searchEngine: v })}
            options={[{ value: 'duckduckgo', label: 'DuckDuckGo' }, { value: 'google', label: 'Google' }, { value: 'bing', label: 'Bing' }]} />
        </Row>
        <Row title={t('general.restore')}>
          <Toggle label={t('general.restore')} checked={s.restoreSession} onChange={(v) => void updateSettings({ restoreSession: v })} />
        </Row>
      </Group>
    </>
  );
}

function Privacy({ s }: { s: SettingsType }) {
  const t = useT();
  const set = (p: Partial<SettingsType>) => void updateSettings(p);
  return (
    <>
      <PageHeader title={t('settings.privacy')} desc={t('privacy.desc')} />
      <Group label={t('privacy.group.adblock')}>
        <Row title={t('privacy.adblock')} desc={t('privacy.adblock.desc')}>
          <Toggle label={t('privacy.adblock')} checked={s.adblockEnabled} onChange={(v) => set({ adblockEnabled: v })} />
        </Row>
        <Row title={t('privacy.youtube')} desc={t('privacy.youtube.desc')}>
          <Toggle label={t('privacy.youtube')} checked={s.adblockYoutube} onChange={(v) => set({ adblockYoutube: v })} />
        </Row>
        <Row title={t('privacy.exceptions')} desc={`${s.adblockAllowlist.length} ${t('common.sites')} · ${t('privacy.exceptions.desc')}`}>
          {s.adblockAllowlist.length > 0 && <Button variant="ghost" onClick={() => set({ adblockAllowlist: [] })}>{t('common.clear')}</Button>}
        </Row>
        {s.adblockAllowlist.map((h) => (
          <Row key={h} title={h}>
            <IconButton icon={Trash2} label={t('common.delete')} onClick={() => set({ adblockAllowlist: s.adblockAllowlist.filter((x) => x !== h) })} />
          </Row>
        ))}
      </Group>
      <Group label={t('privacy.group.connection')}>
        <Row title={t('privacy.https')} desc={t('privacy.https.desc')}>
          <Toggle label={t('privacy.https')} checked={s.httpsOnly} onChange={(v) => set({ httpsOnly: v })} />
        </Row>
        {s.httpsAllowlist.map((h) => (
          <Row key={h} title={h} desc="HTTP">
            <IconButton icon={Trash2} label={t('common.delete')} onClick={() => set({ httpsAllowlist: s.httpsAllowlist.filter((x) => x !== h) })} />
          </Row>
        ))}
        <Row title={t('privacy.doh')} desc={t('privacy.doh.desc')}>
          <Select label={t('privacy.doh')} width={150} value={s.dohMode} onChange={(v) => set({ dohMode: v })}
            options={[{ value: 'off', label: t('common.off') }, { value: 'automatic', label: 'Automatic' }, { value: 'secure', label: 'Strict' }]} />
          <Select label={`${t('privacy.doh')} provider`} width={130} value={s.dohProvider} onChange={(v) => set({ dohProvider: v })}
            options={[{ value: 'cloudflare', label: 'Cloudflare' }, { value: 'google', label: 'Google' }, { value: 'quad9', label: 'Quad9' }]} />
        </Row>
      </Group>
      <Group label={t('privacy.group.cookies')}>
        <Row title={t('privacy.cookies')} desc={t('privacy.cookies.desc')}>
          <Select label={t('privacy.cookies')} width={232} value={s.cookiePolicy} onChange={(v) => set({ cookiePolicy: v })}
            options={[{ value: 'all', label: t('cookies.all') }, { value: 'block-third-party', label: t('cookies.third') }, { value: 'block-all', label: t('cookies.none') }]} />
        </Row>
        <Row title={t('privacy.fingerprint')} desc={t('privacy.fingerprint.desc')}>
          <Segmented label={t('privacy.fingerprint')} value={s.fingerprint} onChange={(v) => set({ fingerprint: v })}
            options={[{ value: 'off', label: t('fp.off') }, { value: 'standard', label: t('fp.standard') }, { value: 'strict', label: t('fp.strict') }]} />
        </Row>
        <Row title={t('privacy.gpc')} desc={t('privacy.gpc.desc')}>
          <Toggle label={t('privacy.gpc')} checked={s.gpc} onChange={(v) => set({ gpc: v })} />
        </Row>
        <Row title={t('privacy.clearOnExit')}>
          <Toggle label={t('privacy.clearOnExit')} checked={s.clearOnExit} onChange={(v) => set({ clearOnExit: v })} />
        </Row>
      </Group>
      <DataSection />
    </>
  );
}

const THEMES: { id: ThemeSetting; label: MessageKey; icon: LucideIcon }[] = [
  { id: 'dark', label: 'appearance.theme.dark', icon: Moon },
  { id: 'light', label: 'appearance.theme.light', icon: Sun },
  { id: 'oled', label: 'appearance.theme.oled', icon: Contrast },
  { id: 'system', label: 'appearance.theme.system', icon: Monitor },
];

function ThemePreview({ theme, accent }: { theme: 'dark' | 'light' | 'oled'; accent: AccentId }) {
  return (
    <div data-theme={theme} data-accent={accent} className="h-[96px] w-full overflow-hidden rounded-md border border-line bg-app" aria-hidden>
      <div className="h-3.5 bg-chrome" />
      <div className="flex h-4 items-center justify-center bg-toolbar"><div className="h-2.5 w-3/5 rounded-full bg-field" /></div>
      <div className="flex flex-col gap-1.5 p-3">
        <div className="h-2 w-2/5 rounded-full bg-fg" />
        <div className="h-1.5 w-3/4 rounded-full bg-fg-3" />
        <div className="mt-1 h-3.5 w-1/4 rounded-full bg-accent" />
      </div>
    </div>
  );
}

const ACCENTS: { id: AccentId; color: string; label: string }[] = [
  { id: 'indigo', color: '#818CF8', label: 'Indigo' },
  { id: 'emerald', color: '#34D399', label: 'Emerald' },
  { id: 'amber', color: '#FBBF24', label: 'Amber' },
  { id: 'rose', color: '#FB7185', label: 'Rose' },
  { id: 'neutral', color: '#C6C6CF', label: 'Neutral' },
];

function Appearance({ s }: { s: SettingsType }) {
  const t = useT();
  const set = (p: Partial<SettingsType>) => void updateSettings(p);
  return (
    <>
      <PageHeader title={t('settings.appearance')} desc={t('appearance.desc')} />
      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-caption font-medium uppercase tracking-wide text-fg-3">{t('appearance.theme')}</h2>
        <div role="radiogroup" aria-label={t('appearance.theme')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map(({ id, label, icon: Icon }) => {
            const on = s.theme === id;
            const preview = id === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ theme: id })}
                className={cx('flex flex-col gap-3 rounded-lg border bg-surface p-3 text-left transition-colors duration-fast hover:bg-hover', on ? 'border-accent ring-1 ring-accent' : 'border-line-subtle')}
              >
                <ThemePreview theme={preview} accent={s.accent} />
                <span className="flex items-center gap-2 text-body font-medium text-fg">
                  <Icon size={16} className={on ? 'text-accent' : 'text-fg-2'} aria-hidden />
                  <span className="flex-1">{t(label)}</span>
                  {on && <Check size={16} className="text-accent" aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <Group>
        <Row title={t('appearance.accent')} desc={t('appearance.accent.desc')}>
          <div role="radiogroup" aria-label={t('appearance.accent')} className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={s.accent === a.id}
                aria-label={a.label}
                title={a.label}
                onClick={() => set({ accent: a.id })}
                className={cx('grid h-9 w-9 place-items-center rounded-full border-2', s.accent === a.id ? 'border-fg' : 'border-transparent')}
              >
                <span className="h-6 w-6 rounded-full" style={{ background: a.color }} />
              </button>
            ))}
          </div>
        </Row>
      </Group>
      <Group label={t('appearance.group.ui')}>
        <Row title={t('appearance.language')} desc={t('appearance.language.desc')}>
          <Select label={t('appearance.language')} width={160} value={s.language} onChange={(v) => set({ language: v })}
            options={[{ value: 'auto', label: 'Auto' }, { value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }]} />
        </Row>
        <Row title={t('appearance.bookmarksBar')}>
          <Toggle label={t('appearance.bookmarksBar')} checked={s.showBookmarksBar} onChange={(v) => set({ showBookmarksBar: v })} />
        </Row>
        <Row title={t('appearance.reduceMotion')} desc={t('appearance.reduceMotion.desc')}>
          <Toggle label={t('appearance.reduceMotion')} checked={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
        </Row>
      </Group>
    </>
  );
}

const SHORTCUTS: [string, string][] = [
  ['Ctrl+T', 'menu.newTab'], ['Ctrl+W', 'tab.close'], ['Ctrl+Shift+T', 'tab.new'], ['Ctrl+Shift+N', 'menu.newPrivate'],
  ['Ctrl+L', 'omnibox.placeholder'], ['Ctrl+F', 'menu.find'], ['Ctrl+D', 'toolbar.bookmark'], ['Ctrl+H', 'menu.history'],
  ['Ctrl+J', 'menu.downloads'], ['Ctrl+P', 'menu.print'], ['Alt+←', 'nav.back'], ['Alt+→', 'nav.forward'],
  ['Ctrl+R / F5', 'nav.reload'], ['Ctrl +/−/0', 'menu.zoom'], ['Ctrl+Tab', 'tab.new'], ['Ctrl+1…9', 'tab.new'],
];

function Shortcuts() {
  const t = useT();
  const rows = SHORTCUTS.filter(([, k], i, arr) => arr.findIndex(([, kk]) => kk === k) === i || k !== 'tab.new');
  return (
    <>
      <PageHeader title={t('settings.shortcuts')} />
      <Group>
        {rows.map(([keys, label]) => (
          <Row key={keys} title={t(label as MessageKey)}>
            <kbd className="rounded-sm border border-line bg-field px-2 py-0.5 font-sans text-small text-fg-2">{keys}</kbd>
          </Row>
        ))}
      </Group>
    </>
  );
}

function About() {
  const t = useT();
  return (
    <>
      <PageHeader title={t('settings.about')} />
      <Group>
        <Row title="TekeliBrowser" desc={`v${boot.version}`} />
        <Row title="Engine" desc={`Electron · Chromium`} />
      </Group>
    </>
  );
}

export function Settings() {
  const t = useT();
  const s = useSettings();
  const [section, setSection] = useState<Section>(sectionFromPath());

  const go = (id: Section) => {
    setSection(id);
    if (location.protocol === 'tekeli:') history.pushState(null, '', `/${id}`);
  };

  return (
    <div className="flex h-full justify-center overflow-y-auto bg-app px-6 py-12">
      <div className="flex h-fit w-full max-w-[1000px] gap-12">
        <nav aria-label={t('settings.title')} className="sticky top-0 flex w-[232px] shrink-0 flex-col gap-0.5 self-start">
          <h1 className="m-0 px-3 pb-3 pt-2 text-title font-semibold text-fg">{t('settings.title')}</h1>
          {NAV.map(({ id, label, icon: Icon }) => {
            const on = id === section;
            return (
              <button
                key={id}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => go(id)}
                className={cx('flex h-9 items-center gap-3 rounded-md px-3 text-body transition-colors duration-fast', on ? 'bg-accent-subtle font-medium text-accent' : 'text-fg-2 hover:bg-hover hover:text-fg')}
              >
                <Icon size={18} aria-hidden /> {t(label)}
              </button>
            );
          })}
        </nav>
        <main className="flex min-w-0 max-w-[720px] flex-1 flex-col gap-6 pb-12">
          {section === 'general' && <General s={s} />}
          {section === 'privacy' && <Privacy s={s} />}
          {section === 'appearance' && <Appearance s={s} />}
          {section === 'passwords' && <Passwords />}
          {section === 'updates' && <Updates />}
          {section === 'shortcuts' && <Shortcuts />}
          {section === 'about' && <About />}
        </main>
      </div>
    </div>
  );
}
