import { ArrowLeft, ArrowRight, Download, Ellipsis, House, RotateCw, ShieldCheck, X } from 'lucide-react';
import { invoke, useSettings, useT } from '../lib/bridge';
import { IconButton } from '../lib/ui';
import type { TabInfo } from '../types/tekeli';
import { Omnibox } from './Omnibox';

const send = (cmd: Record<string, unknown>) => void invoke('tabs:do', cmd);

export function Toolbar({ tab, canReopen }: { tab: TabInfo | null; canReopen: boolean }) {
  const t = useT();
  const settings = useSettings();
  return (
    <div className="no-drag flex h-11 shrink-0 items-center gap-1 border-b border-line-subtle bg-toolbar px-2">
      <IconButton icon={ArrowLeft} label={t('nav.back')} disabled={!tab?.canGoBack} onClick={() => send({ type: 'back' })} />
      <IconButton icon={ArrowRight} label={t('nav.forward')} disabled={!tab?.canGoForward} onClick={() => send({ type: 'forward' })} />
      {tab?.loading
        ? <IconButton icon={X} label={t('nav.stop')} onClick={() => send({ type: 'stop' })} />
        : <IconButton icon={RotateCw} label={t('nav.reload')} onClick={() => send({ type: 'reload' })} />}
      <IconButton icon={House} label={t('nav.home')} onClick={() => send({ type: 'home' })} />
      <Omnibox tab={tab} canReopen={canReopen} />
      {settings.adblockEnabled && (
        <IconButton icon={ShieldCheck} label={t('toolbar.shield')} className="text-ok hover:text-ok" onClick={() => send({ type: 'open-internal', page: 'settings', sub: 'privacy' })} />
      )}
      <IconButton icon={Download} label={t('toolbar.downloads')} onClick={() => send({ type: 'open-internal', page: 'downloads' })} />
      <IconButton icon={Ellipsis} label={t('toolbar.menu')} onClick={() => send({ type: 'show-menu' })} />
    </div>
  );
}
