import { Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke, useBridgeEvent, useLang, useT } from '../lib/bridge';
import { Button, Favicon, IconButton, PageHeader } from '../lib/ui';
import type { HistoryItem } from '../types/tekeli';

const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function History() {
  const t = useT();
  const lang = useLang();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(false);

  const load = useCallback((search: string) => {
    void invoke<{ items: HistoryItem[] }>('history:list', search).then((r) => setItems(r.items));
  }, []);
  useEffect(() => {
    const h = setTimeout(() => load(q), 150); // debounce typing
    return () => clearTimeout(h);
  }, [q, load]);
  useBridgeEvent('history:changed', useCallback(() => load(q), [load, q]));

  const groups = useMemo(() => {
    const today = startOfDay(Date.now());
    const map = new Map<number, HistoryItem[]>();
    for (const it of items) {
      const day = startOfDay(it.timestamp);
      map.set(day, [...(map.get(day) ?? []), it]);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([day, list]) => ({
      label: day === today ? t('history.today') : day === today - 86400000 ? t('history.yesterday') : new Date(day).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
      list,
    }));
  }, [items, lang, t]);

  return (
    <div className="h-full overflow-y-auto bg-app px-6 py-12">
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 pb-12">
        <div className="flex items-start gap-3">
          <div className="flex-1"><PageHeader title={t('history.title')} /></div>
          {confirm ? (
            <div className="flex items-center gap-2">
              <Button variant="danger" onClick={() => { void invoke('history:clear'); setConfirm(false); }}>{t('common.clear')}</Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>{t('common.cancel')}</Button>
            </div>
          ) : (
            <Button onClick={() => setConfirm(true)}>{t('history.clear')}</Button>
          )}
        </div>

        <label className="flex h-9 items-center gap-2 rounded-md border border-line bg-field px-3 focus-within:border-accent">
          <Search size={16} className="text-fg-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('history.search')} aria-label={t('history.search')} className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3" />
        </label>

        {groups.length === 0 && <p className="m-0 py-12 text-center text-body text-fg-3">{t('history.empty')}</p>}
        {groups.map((g) => (
          <section key={g.label} className="flex flex-col gap-2">
            <h2 className="m-0 text-caption font-medium uppercase tracking-wide text-fg-3">{g.label}</h2>
            <ul className="m-0 list-none overflow-hidden rounded-lg border border-line-subtle bg-surface p-0 [&>li+li]:border-t [&>li+li]:border-line-subtle">
              {g.list.map((it) => (
                <li key={it.url} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-hover">
                  <span className="w-11 shrink-0 text-small text-fg-3">{new Date(it.timestamp).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <Favicon url={it.url} size={18} />
                  <button type="button" onClick={() => void invoke('tabs:do', { type: 'navigate', input: it.url })} className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="truncate text-body font-medium text-fg">{it.title || it.url}</span>
                    <span className="truncate text-small text-fg-3">{it.url}</span>
                  </button>
                  <IconButton icon={Trash2} label={t('common.delete')} className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100" onClick={() => void invoke('history:delete', it.url)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
