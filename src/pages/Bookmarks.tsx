import { Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { invoke, useBridgeEvent, useT } from '../lib/bridge';
import { Favicon, IconButton, PageHeader } from '../lib/ui';
import type { BookmarkItem } from '../types/tekeli';

export function Bookmarks() {
  const t = useT();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback((search: string) => {
    void invoke<{ items: BookmarkItem[] }>('bookmarks:list', search).then((r) => setItems(r.items));
  }, []);
  useEffect(() => {
    const h = setTimeout(() => load(q), 150);
    return () => clearTimeout(h);
  }, [q, load]);
  useBridgeEvent('bookmarks:changed', useCallback(() => load(q), [load, q]));

  return (
    <div className="h-full overflow-y-auto bg-app px-6 py-12">
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 pb-12">
        <PageHeader title={t('menu.bookmarks')} />
        <label className="flex h-9 items-center gap-2 rounded-md border border-line bg-field px-3 focus-within:border-accent">
          <Search size={16} className="text-fg-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('menu.bookmarks')} aria-label={t('menu.bookmarks')} className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3" />
        </label>
        {items.length === 0 && <p className="m-0 py-12 text-center text-body text-fg-3">—</p>}
        {items.length > 0 && (
          <ul className="m-0 list-none overflow-hidden rounded-lg border border-line-subtle bg-surface p-0 [&>li+li]:border-t [&>li+li]:border-line-subtle">
            {items.map((b) => (
              <li key={b.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-hover">
                <Favicon url={b.url} size={18} />
                <button type="button" onClick={() => void invoke('tabs:do', { type: 'navigate', input: b.url })} className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-body font-medium text-fg">{b.title || b.url}</span>
                  <span className="truncate text-small text-fg-3">{b.url}</span>
                </button>
                <IconButton icon={Trash2} label={t('common.delete')} className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100" onClick={() => void invoke('bookmarks:remove', b.url)} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
