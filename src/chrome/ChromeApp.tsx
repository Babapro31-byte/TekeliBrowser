import { useCallback, useEffect, useState } from 'react';
import { boot, invoke, on, useSettings } from '../lib/bridge';
import type { BookmarkItem, TabsState } from '../types/tekeli';
import { FindBar } from './FindBar';
import { PermissionBar } from './PermissionBar';
import { SavePasswordBar } from './SavePasswordBar';
import { TabStrip } from './TabStrip';
import { Toolbar } from './Toolbar';
import { Favicon } from '../lib/ui';

const EMPTY: TabsState = { tabs: [], activeId: null, canReopen: false };

function useTabs(): TabsState {
  const [state, setState] = useState<TabsState>(EMPTY);
  useEffect(() => {
    let alive = true;
    void invoke<TabsState>('tabs:state').then((s) => { if (alive) setState(s); });
    const off = on<TabsState>('tabs:state', setState);
    return () => { alive = false; off(); };
  }, []);
  return state;
}

function BookmarksBar() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const load = useCallback(() => { void invoke<{ items: BookmarkItem[] }>('bookmarks:list', '').then((r) => setItems(r.items.slice(0, 30))); }, []);
  useEffect(() => { load(); return on('bookmarks:changed', load); }, [load]);
  return (
    <div className="no-drag flex h-8 items-center gap-1 overflow-hidden border-b border-line-subtle bg-toolbar px-2">
      {items.map((b) => (
        <button
          key={b.id}
          type="button"
          title={b.url}
          onClick={() => void invoke('tabs:do', { type: 'navigate', input: b.url })}
          className="flex h-6 max-w-[160px] items-center gap-1.5 rounded-md px-2 text-small text-fg-2 hover:bg-hover hover:text-fg"
        >
          <Favicon url={b.url} size={14} />
          <span className="truncate">{b.title || b.url}</span>
        </button>
      ))}
    </div>
  );
}

export function ChromeApp() {
  const tabs = useTabs();
  const settings = useSettings();
  const [findOpen, setFindOpen] = useState(false);

  useEffect(() => on('chrome:open-find', () => setFindOpen(true)), []);
  const closeFind = useCallback(() => { setFindOpen(false); void invoke('find:do', { stop: true, open: false }); }, []);
  useEffect(() => { void invoke('find:do', { open: findOpen }); }, [findOpen]);

  // Esc closes the find bar from anywhere in the chrome.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && findOpen) closeFind(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [findOpen, closeFind]);

  const active = tabs.tabs.find((t) => t.id === tabs.activeId) ?? null;

  return (
    <div className="chrome-root flex h-full flex-col bg-chrome">
      <TabStrip tabs={tabs} isPrivate={boot.isPrivate} platform={boot.platform} />
      <Toolbar tab={active} canReopen={tabs.canReopen} />
      {settings.showBookmarksBar && <BookmarksBar />}
      {findOpen && <FindBar onClose={closeFind} />}
      <PermissionBar />
      <SavePasswordBar />
    </div>
  );
}
