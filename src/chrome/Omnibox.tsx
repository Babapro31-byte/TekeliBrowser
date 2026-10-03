import { AppWindow, Globe, Lock, Star, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { displayUrl, isSearchInput } from '../../shared/url';
import { invoke, on, useSettings, useT } from '../lib/bridge';
import { cx } from '../lib/ui';
import type { TabInfo } from '../types/tekeli';

interface Row { kind: 'search' | 'url' | 'history' | 'bookmark'; text: string; title?: string }
const ROW_H = 40;
const MAX_ROWS = 8;

function SecurityIcon({ tab }: { tab: TabInfo | null }) {
  const t = useT();
  switch (tab?.security) {
    case 'secure': return <Lock size={14} className="text-fg-2" aria-label={t('omnibox.secure')} />;
    case 'insecure': return <TriangleAlert size={14} className="text-warn" aria-label={t('omnibox.insecure')} />;
    case 'internal': return <AppWindow size={14} className="text-fg-2" aria-label={t('omnibox.internal')} />;
    default: return <Globe size={14} className="text-fg-3" aria-hidden />;
  }
}

export function Omnibox({ tab, canReopen: _canReopen }: { tab: TabInfo | null; canReopen: boolean }) {
  const t = useT();
  const settings = useSettings();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [typed, setTyped] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState(-1);
  const [bookmarked, setBookmarked] = useState(false);

  const url = tab?.url ?? '';
  const blank = url === 'tekeli://newtab' ? '' : url;
  const canBookmark = /^https?:/i.test(url);
  const value = editing ? (selected >= 0 && rows[selected] ? rows[selected].text : typed) : displayUrl(url);

  // ----- overlay -----
  const hideOverlay = useCallback(() => { void invoke('overlay:hide'); }, []);
  const overlayData = (list: Row[], sel: number) => ({ kind: 'suggest', rows: list, selected: sel });

  useEffect(() => {
    if (!editing || !typed.trim()) { setRows([]); setSelected(-1); hideOverlay(); return; }
    let alive = true;
    const handle = setTimeout(() => {
      void invoke<{ items: { kind: 'history' | 'bookmark'; url: string; title: string }[] }>('omnibox:suggest', typed).then((r) => {
        if (!alive) return;
        const head: Row = { kind: isSearchInput(typed, settings.searchEngine) ? 'search' : 'url', text: typed.trim() };
        const list: Row[] = [head, ...r.items.filter((i) => i.url !== typed.trim()).map((i) => ({ kind: i.kind, text: i.url, title: i.title }))].slice(0, MAX_ROWS);
        setRows(list);
        setSelected(-1);
        const rect = formRef.current?.getBoundingClientRect();
        if (rect) void invoke('overlay:show', { x: rect.left, y: rect.bottom + 4, width: rect.width, height: list.length * ROW_H + 10 }, overlayData(list, -1));
      });
    }, 70);
    return () => { alive = false; clearTimeout(handle); };
  }, [typed, editing, settings.searchEngine, hideOverlay]);

  useEffect(() => { if (rows.length) void invoke('overlay:update', overlayData(rows, selected)); }, [selected, rows]);

  // Overlay clicks come back as picks.
  useEffect(() => on<{ kind: string; index: number }>('overlay:pick', (p) => {
    const row = rows[p.index];
    if (row) { void invoke('tabs:do', { type: 'navigate', input: row.text }); setEditing(false); setRows([]); hideOverlay(); inputRef.current?.blur(); }
  }), [rows, hideOverlay]);

  // A new page replaces the draft.
  useEffect(() => { if (!editing) setTyped(blank); }, [blank, tab?.id, editing]);
  useEffect(() => { hideOverlay(); }, [tab?.id, hideOverlay]);

  const refreshBookmark = useCallback(() => {
    if (!canBookmark) { setBookmarked(false); return; }
    void invoke<{ bookmarked: boolean }>('bookmarks:is', url).then((r) => setBookmarked(r.bookmarked));
  }, [canBookmark, url]);
  useEffect(() => { refreshBookmark(); return on('bookmarks:changed', refreshBookmark); }, [refreshBookmark]);

  useEffect(() => on('chrome:focus-omnibox', () => { inputRef.current?.focus(); inputRef.current?.select(); }), []);

  const finish = () => { setEditing(false); setRows([]); setSelected(-1); hideOverlay(); inputRef.current?.blur(); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = (selected >= 0 && rows[selected] ? rows[selected].text : typed).trim();
    if (!text) return;
    void invoke('tabs:do', { type: 'navigate', input: text });
    finish();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setTyped(blank); finish(); return; }
    if (rows.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((i) => (i + 1 >= rows.length ? -1 : i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((i) => (i - 1 < -1 ? rows.length - 1 : i - 1)); }
  };

  return (
    <form ref={formRef} onSubmit={submit} className={cx('flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full border bg-field px-3 transition-colors duration-fast', editing ? 'border-accent' : 'border-line-subtle hover:border-line')}>
      <SecurityIcon tab={tab} />
      <input
        ref={inputRef}
        value={value}
        spellCheck={false}
        autoComplete="off"
        role="combobox"
        aria-expanded={rows.length > 0}
        aria-autocomplete="list"
        aria-label={t('omnibox.placeholder')}
        placeholder={t('omnibox.placeholder')}
        onFocus={(e) => { setEditing(true); setTyped(blank); requestAnimationFrame(() => e.target.select()); }}
        // Delay so a click on the overlay row (which blurs this input first) still registers.
        onBlur={() => { setTimeout(() => { setEditing(false); hideOverlay(); }, 150); }}
        onChange={(e) => { setEditing(true); setSelected(-1); setTyped(e.target.value); }}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3"
      />
      <button
        type="button"
        disabled={!canBookmark}
        aria-label={t('toolbar.bookmark')}
        aria-pressed={bookmarked}
        title={t('toolbar.bookmark')}
        onClick={() => void invoke('bookmarks:toggle')}
        className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full', canBookmark ? 'hover:bg-hover' : 'opacity-40', bookmarked ? 'text-accent' : 'text-fg-2')}
      >
        <Star size={16} fill={bookmarked ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </form>
  );
}
