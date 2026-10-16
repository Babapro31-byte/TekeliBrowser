import { ArrowLeft, ArrowRight, CircleArrowUp, Download, Ellipsis, House, RotateCw, ShieldCheck, ShieldOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { invoke, on, useSettings, useT } from '../lib/bridge';
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

function useActiveDownloads(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const count = (list: { state: string }[]) => list.filter((d) => d.state === 'progressing' || d.state === 'paused').length;
    void invoke<{ items: { state: string }[] }>('downloads:list').then((r) => setN(count(r.items)));
    return on<{ state: string }[]>('downloads:changed', (list) => setN(count(list)));
  }, []);
  return n;
}

function UpdatePill() {
  const t = useT();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void invoke<{ status: string }>('update:state').then((u) => setReady(u.status === 'ready'));
    return on<{ status: string }>('update:state', (u) => setReady(u.status === 'ready'));
  }, []);
  if (!ready) return null;
  return (
    <button
      type="button"
      title={t('toolbar.update')}
      aria-label={t('toolbar.update')}
      onClick={() => send({ type: 'open-internal', page: 'settings', sub: 'updates' })}
      className="no-drag flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent-subtle px-3 text-small font-medium text-accent hover:brightness-110"
    >
      <CircleArrowUp size={16} aria-hidden /> {t('update.restart')}
    </button>
  );
}

export function Toolbar({ tab, canReopen }: { tab: TabInfo | null; canReopen: boolean }) {
  const t = useT();
  const activeDownloads = useActiveDownloads();
  return (
    <div className="no-drag flex h-11 shrink-0 items-center gap-1 border-b border-line-subtle bg-toolbar px-2">
      <IconButton icon={ArrowLeft} label={t('nav.back')} disabled={!tab?.canGoBack} onClick={() => send({ type: 'back' })} />
      <IconButton icon={ArrowRight} label={t('nav.forward')} disabled={!tab?.canGoForward} onClick={() => send({ type: 'forward' })} />
      {tab?.loading
        ? <IconButton icon={X} label={t('nav.stop')} onClick={() => send({ type: 'stop' })} />
        : <IconButton icon={RotateCw} label={t('nav.reload')} onClick={() => send({ type: 'reload' })} />}
      <IconButton icon={House} label={t('nav.home')} onClick={() => send({ type: 'home' })} />
      <Omnibox tab={tab} canReopen={canReopen} />
      <UpdatePill />
      <ShieldButton tab={tab} />
      <div className="relative">
        <IconButton icon={Download} label={t('toolbar.downloads')} onClick={() => send({ type: 'open-internal', page: 'downloads' })} />
        {activeDownloads > 0 && <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" aria-hidden />}
      </div>
      <IconButton icon={Ellipsis} label={t('toolbar.menu')} onClick={() => send({ type: 'show-menu' })} />
    </div>
  );
}
