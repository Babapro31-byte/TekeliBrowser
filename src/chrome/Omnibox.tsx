import { AppWindow, Globe, Lock, Star, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { displayUrl } from '../../shared/url';
import { invoke, on, useT } from '../lib/bridge';
import { cx } from '../lib/ui';
import type { TabInfo } from '../types/tekeli';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  const url = tab?.url ?? '';
  const shown = editing ? text : displayUrl(url);
  const canBookmark = /^https?:/i.test(url);

  // Reset the draft whenever the page (or active tab) changes while not editing.
  useEffect(() => { if (!editing) setText(url === 'tekeli://newtab' ? '' : url); }, [url, tab?.id, editing]);

  const refreshBookmark = useCallback(() => {
    if (!canBookmark) { setBookmarked(false); return; }
    void invoke<{ bookmarked: boolean }>('bookmarks:is', url).then((r) => setBookmarked(r.bookmarked));
  }, [canBookmark, url]);
  useEffect(() => { refreshBookmark(); return on('bookmarks:changed', refreshBookmark); }, [refreshBookmark]);

  useEffect(() => on('chrome:focus-omnibox', () => { inputRef.current?.focus(); inputRef.current?.select(); }), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    void invoke('tabs:do', { type: 'navigate', input: value });
    setEditing(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setText(url === 'tekeli://newtab' ? '' : url);
      setEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={submit} className={cx('flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full border bg-field px-3 transition-colors duration-fast', editing ? 'border-accent' : 'border-line-subtle hover:border-line')}>
      <SecurityIcon tab={tab} />
      <input
        ref={inputRef}
        value={shown}
        spellCheck={false}
        autoComplete="off"
        aria-label={t('omnibox.placeholder')}
        placeholder={t('omnibox.placeholder')}
        onFocus={(e) => { setEditing(true); setText(url === 'tekeli://newtab' ? '' : url); requestAnimationFrame(() => e.target.select()); }}
        onBlur={() => setEditing(false)}
        onChange={(e) => { setEditing(true); setText(e.target.value); }}
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
