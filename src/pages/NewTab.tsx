import { EyeOff, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { boot, invoke, useT } from '../lib/bridge';
import { Favicon } from '../lib/ui';
import type { HistoryItem } from '../types/tekeli';

interface Tile { url: string; host: string }

function topSites(items: HistoryItem[]): Tile[] {
  const byHost = new Map<string, { url: string; score: number }>();
  for (const it of items) {
    try {
      const u = new URL(it.url);
      const host = u.hostname.replace(/^www\./, '');
      const cur = byHost.get(host);
      byHost.set(host, { url: cur?.url ?? `${u.protocol}//${u.host}/`, score: (cur?.score ?? 0) + it.visitCount });
    } catch { /* skip */ }
  }
  return [...byHost.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 6).map(([host, v]) => ({ host, url: v.url }));
}

export function NewTab() {
  const t = useT();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (boot.isPrivate) return;
    void invoke<{ items: HistoryItem[] }>('history:list', '').then((r) => setTiles(topSites(r.items)));
  }, []);

  const go = (value: string) => { if (value.trim()) void invoke('tabs:do', { type: 'navigate', input: value.trim() }); };
  const submit = (e: FormEvent) => { e.preventDefault(); go(q); };

  return (
    <main className="flex h-full flex-col items-center justify-center gap-7 bg-app px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-lg bg-accent-subtle text-accent">
          {boot.isPrivate ? <EyeOff size={30} aria-hidden /> : <ShieldCheck size={32} aria-hidden />}
        </div>
        <h1 className="m-0 text-display font-semibold text-fg">Tekeli</h1>
      </div>

      {boot.isPrivate && (
        <p className="m-0 max-w-md text-center text-body text-fg-2">
          {boot.lang === 'tr'
            ? 'Gizli pencere: geçmiş, çerez ve site verileri bu pencere kapanınca silinir.'
            : 'Private window: history, cookies and site data are deleted when this window closes.'}
        </p>
      )}

      <form onSubmit={submit} className="flex h-[52px] w-full max-w-[600px] items-center gap-3 rounded-full border border-line bg-surface px-5 transition-colors duration-fast focus-within:border-accent">
        <Search size={20} className="shrink-0 text-fg-3" aria-hidden />
        <input
          ref={input}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t('newtab.search')}
          placeholder={t('newtab.search')}
          className="min-w-0 flex-1 bg-transparent text-title text-fg outline-none placeholder:text-fg-3"
        />
      </form>

      {tiles.length > 0 && (
        <nav aria-label="Top sites" className="flex flex-wrap justify-center gap-6">
          {tiles.map((s) => (
            <button key={s.host} type="button" onClick={() => go(s.url)} className="flex w-[88px] flex-col items-center gap-2 rounded-lg p-1 text-fg-2 hover:text-fg">
              <span className="grid h-14 w-14 place-items-center rounded-xl border border-line-subtle bg-surface transition-colors duration-fast hover:bg-hover">
                <Favicon url={s.url} size={28} />
              </span>
              <span className="w-full truncate text-center text-small">{s.host}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
