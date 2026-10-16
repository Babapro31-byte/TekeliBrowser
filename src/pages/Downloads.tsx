import { Download as DownloadIcon, FileDown, FolderOpen, Pause, Play, TriangleAlert, Trash2, X, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { invoke, useBridgeEvent, useT } from '../lib/bridge';
import { Button, IconButton, PageHeader, cx } from '../lib/ui';

interface Item {
  id: string; url: string; filename: string; savePath: string; received: number; total: number;
  state: 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted'; startedAt: number; endedAt?: number; dangerous: boolean;
}

const fmt = (n: number) => {
  if (n <= 0) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
};

const act = (id: string | undefined, action: string) => void invoke('downloads:do', { id, action });

function Row({ it }: { it: Item }) {
  const t = useT();
  const active = it.state === 'progressing' || it.state === 'paused';
  const failed = it.state === 'interrupted' || it.state === 'cancelled';
  const pct = it.total > 0 ? Math.min(100, Math.round((it.received / it.total) * 100)) : 0;
  let host = '';
  try { host = new URL(it.url).hostname; } catch { /* data/blob url */ }
  const Icon: LucideIcon = failed ? TriangleAlert : FileDown;
  const status = active
    ? `${fmt(it.received)}${it.total > 0 ? ` / ${fmt(it.total)}` : ''}${it.state === 'paused' ? ` · ${t('downloads.paused')}` : ''}`
    : failed
      ? t(it.state === 'cancelled' ? 'downloads.cancelled' : 'downloads.failed')
      : fmt(it.total || it.received);

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', failed ? 'bg-danger-subtle text-danger' : 'bg-hover text-fg-2')}>
        <Icon size={18} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-body font-medium text-fg">{it.filename}</span>
        <span className="truncate text-small text-fg-2">{[status, host, it.dangerous && !failed ? t('downloads.dangerous') : ''].filter(Boolean).join(' · ')}</span>
        {active && (
          <div className="h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-pressed" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-slow" style={{ width: `${it.total > 0 ? pct : 30}%` }} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {active && <IconButton icon={it.state === 'paused' ? Play : Pause} label={t(it.state === 'paused' ? 'downloads.resume' : 'downloads.pause')} onClick={() => act(it.id, it.state === 'paused' ? 'resume' : 'pause')} />}
        {active && <IconButton icon={X} label={t('downloads.cancel')} onClick={() => act(it.id, 'cancel')} />}
        {it.state === 'completed' && <Button onClick={() => act(it.id, 'show')}>{t('downloads.show')}</Button>}
        {it.state === 'completed' && <Button variant="ghost" onClick={() => act(it.id, 'open')}>{t('downloads.open')}</Button>}
        {failed && <Button variant="danger" onClick={() => void invoke('tabs:do', { type: 'navigate', input: it.url })}>{t('downloads.retry')}</Button>}
        {!active && <IconButton icon={Trash2} label={t('common.delete')} onClick={() => act(it.id, 'remove')} />}
      </div>
    </li>
  );
}

export function Downloads() {
  const t = useT();
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { void invoke<{ items: Item[] }>('downloads:list').then((r) => setItems(r.items)); }, []);
  useBridgeEvent('downloads:changed', useCallback((list: Item[]) => setItems(list), []));

  return (
    <div className="h-full overflow-y-auto bg-app px-6 py-12">
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 pb-12">
        <div className="flex items-start gap-3">
          <div className="flex-1"><PageHeader title={t('downloads.title')} /></div>
          <Button variant="ghost" onClick={() => act(undefined, 'clear')}>{t('downloads.clear')}</Button>
          <Button onClick={() => act(undefined, 'open-folder')}><FolderOpen size={16} className="mr-2" aria-hidden />{t('downloads.openFolder')}</Button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-fg-3">
            <DownloadIcon size={32} aria-hidden />
            <p className="m-0 text-body">{t('downloads.empty')}</p>
          </div>
        ) : (
          <ul className="m-0 list-none overflow-hidden rounded-lg border border-line-subtle bg-surface p-0 [&>li+li]:border-t [&>li+li]:border-line-subtle">
            {items.map((it) => <Row key={it.id} it={it} />)}
          </ul>
        )}
      </main>
    </div>
  );
}
