import { ArrowLeft, ArrowRight, Download, Ellipsis, House, RotateCw, ShieldCheck, ShieldOff, X } from 'lucide-react';
import { invoke, useSettings, useT } from '../lib/bridge';
import { IconButton } from '../lib/ui';
import type { TabInfo } from '../types/tekeli';
import { Omnibox } from './Omnibox';

const send = (cmd: Record<string, unknown>) => void invoke('tabs:do', cmd);

function ShieldButton({ tab }: { tab: TabInfo | null }) {
  const t = useT();
  const settings = useSettings();
  let host = '';
  try { host = tab && /^https?:/i.test(tab.url) ? new URL(tab.url).hostname : ''; } catch { /* internal page */ }
  const allowlisted = !!host && settings.adblockAllowlist.some((d) => host === d || host.endsWith(`.${d}`));
  const active = settings.adblockEnabled && !allowlisted;
  const count = active ? tab?.blocked ?? 0 : 0;
  const Icon = active ? ShieldCheck : ShieldOff;
  return (
    <button
      type="button"
      aria-label={`${t('toolbar.shield')}${count ? `: ${count}` : ''}`}
      title={t('toolbar.shield')}
      onClick={() => send({ type: 'show-shield' })}
      className={`no-drag flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 transition-colors duration-fast hover:bg-hover ${active ? 'text-ok' : 'text-fg-3'}`}
    >
      <Icon size={18} aria-hidden />
      {count > 0 && <span className="min-w-[1ch] text-small font-medium tabular-nums">{count > 999 ? '999+' : count}</span>}
    </button>
  );
}

export function Toolbar({ tab, canReopen }: { tab: TabInfo | null; canReopen: boolean }) {
  const t = useT();
  return (
    <div className="no-drag flex h-11 shrink-0 items-center gap-1 border-b border-line-subtle bg-toolbar px-2">
      <IconButton icon={ArrowLeft} label={t('nav.back')} disabled={!tab?.canGoBack} onClick={() => send({ type: 'back' })} />
      <IconButton icon={ArrowRight} label={t('nav.forward')} disabled={!tab?.canGoForward} onClick={() => send({ type: 'forward' })} />
      {tab?.loading
        ? <IconButton icon={X} label={t('nav.stop')} onClick={() => send({ type: 'stop' })} />
        : <IconButton icon={RotateCw} label={t('nav.reload')} onClick={() => send({ type: 'reload' })} />}
      <IconButton icon={House} label={t('nav.home')} onClick={() => send({ type: 'home' })} />
      <Omnibox tab={tab} canReopen={canReopen} />
      <ShieldButton tab={tab} />
      <IconButton icon={Download} label={t('toolbar.downloads')} onClick={() => send({ type: 'open-internal', page: 'downloads' })} />
      <IconButton icon={Ellipsis} label={t('toolbar.menu')} onClick={() => send({ type: 'show-menu' })} />
    </div>
  );
}
