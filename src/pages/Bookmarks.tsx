import { Download, Search, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke, useBridgeEvent, useT } from '../lib/bridge';
import { Button, Favicon, IconButton, PageHeader } from '../lib/ui';
import type { BookmarkItem } from '../types/tekeli';

const ALL = '\u0000all';
const NONE = '\u0000none';

/** Free-text folder with suggestions (datalist). Saved on blur or Enter. */
function FolderInput({ value, label, onSave }: { value: string; label: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => { if (draft.trim() !== value) onSave(draft.trim()); };
  return (
    <input
      list="bookmark-folders"
      value={draft}
      maxLength={100}
      aria-label={label}
      placeholder={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(value); e.currentTarget.blur(); } }}
      className="h-7 w-32 shrink-0 rounded-md border border-transparent bg-transparent px-2 text-small text-fg-2 outline-none placeholder:text-fg-3 hover:border-line focus-visible:border-accent"
    />
  );
}

export function Bookmarks() {
  const t = useT();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [q, setQ] = useState('');
  const [folder, setFolder] = useState(ALL);
  const [note, setNote] = useState('');

  const load = useCallback((search: string) => {
    void invoke<{ items: BookmarkItem[] }>('bookmarks:list', search).then((r) => setItems(r.items));
  }, []);
  useEffect(() => {
    const h = setTimeout(() => load(q), 150);
    return () => clearTimeout(h);
  }, [q, load]);
  useBridgeEvent('bookmarks:changed', useCallback(() => load(q), [load, q]));

  const folders = useMemo(() => [...new Set(items.map((b) => b.folder).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items]);
  // If the selected folder disappears (last bookmark moved or deleted), fall back to "All".
  useEffect(() => { if (folder !== ALL && folder !== NONE && !folders.includes(folder)) setFolder(ALL); }, [folders, folder]);
  const shown = items.filter((b) => folder === ALL || (folder === NONE ? !b.folder : b.folder === folder));

  const run = async (channel: 'bookmarks:import' | 'bookmarks:export') => {
    const r = await invoke<{ ok: boolean; canceled?: boolean; total?: number; added?: number }>(channel);
    if (r.canceled) return;
    if (!r.ok) { setNote(t('bookmarks.importFailed')); return; }
    setNote(channel === 'bookmarks:import'
      ? t('bookmarks.imported').replace('{added}', String(r.added ?? 0)).replace('{total}', String(r.total ?? 0))
      : t('bookmarks.exported').replace('{total}', String(r.total ?? 0)));
  };

  const chips: { id: string; label: string }[] = [
    { id: ALL, label: t('bookmarks.folder.all') },
    ...folders.map((f) => ({ id: f, label: f })),
    ...(folders.length > 0 && items.some((b) => !b.folder) ? [{ id: NONE, label: t('bookmarks.folder.none') }] : []),
  ];

  return (
    <div className="h-full overflow-y-auto bg-app px-6 py-12">
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 pb-12">
        <div className="flex items-start justify-between gap-4">
          <PageHeader title={t('menu.bookmarks')} />
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => void run('bookmarks:import')}><Upload size={14} className="mr-1.5" aria-hidden />{t('bookmarks.import')}</Button>
            <Button variant="secondary" onClick={() => void run('bookmarks:export')}><Download size={14} className="mr-1.5" aria-hidden />{t('bookmarks.export')}</Button>
          </div>
        </div>
        <label className="flex h-9 items-center gap-2 rounded-md border border-line bg-field px-3 focus-within:border-accent">
          <Search size={16} className="text-fg-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('menu.bookmarks')} aria-label={t('menu.bookmarks')} className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3" />
        </label>
        {note && <p role="status" className="m-0 text-small text-fg-2">{note}</p>}
        {chips.length > 1 && (
          <div role="tablist" aria-label={t('bookmarks.folder')} className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={folder === c.id}
                onClick={() => setFolder(c.id)}
                className={`h-7 rounded-full border px-3 text-small transition-colors duration-fast ${folder === c.id ? 'border-accent bg-accent-subtle text-accent' : 'border-line text-fg-2 hover:bg-hover'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <datalist id="bookmark-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
        {shown.length === 0 && <p className="m-0 py-12 text-center text-body text-fg-3">—</p>}
        {shown.length > 0 && (
          <ul className="m-0 list-none overflow-hidden rounded-lg border border-line-subtle bg-surface p-0 [&>li+li]:border-t [&>li+li]:border-line-subtle">
            {shown.map((b) => (
              <li key={b.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-hover">
                <Favicon url={b.url} size={18} />
                <button type="button" onClick={() => void invoke('tabs:do', { type: 'navigate', input: b.url })} className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-body font-medium text-fg">{b.title || b.url}</span>
                  <span className="truncate text-small text-fg-3">{b.url}</span>
                </button>
                <FolderInput value={b.folder} label={t('bookmarks.folder')} onSave={(v) => void invoke('bookmarks:set-folder', b.url, v)} />
                <IconButton icon={Trash2} label={t('common.delete')} className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100" onClick={() => void invoke('bookmarks:remove', b.url)} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
