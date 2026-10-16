import { EyeOff, LoaderCircle, Plus, Volume2, VolumeX, X } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { invoke, useT } from '../lib/bridge';
import { Favicon, IconButton, cx } from '../lib/ui';
import type { TabInfo, TabsState } from '../types/tekeli';

const send = (cmd: Record<string, unknown>) => void invoke('tabs:do', cmd);

function TabItem({ tab, active, onDragStart, onDrop }: {
  tab: TabInfo; active: boolean; onDragStart: () => void; onDrop: () => void;
}) {
  const t = useT();
  const title = tab.title || (tab.url === 'tekeli://newtab' ? t('tab.new') : tab.url);
  const compact = tab.pinned;
  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-tab-id={tab.id}
      title={title}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => send({ type: 'activate', id: tab.id })}
      onAuxClick={(e) => { if (e.button === 1) send({ type: 'close', id: tab.id }); }}
      onDoubleClick={() => { if (tab.pinned) send({ type: 'pin', id: tab.id }); }}
      className={cx(
        'no-drag group relative flex h-[34px] items-center gap-2 rounded-t-md px-3 transition-colors duration-fast',
        compact ? 'w-10 justify-center px-0' : 'min-w-[44px] max-w-[220px] flex-1 basis-[200px]',
        active ? 'bg-toolbar text-fg shadow-tab' : 'text-fg-2 hover:bg-hover/60',
      )}
    >
      {tab.loading ? <LoaderCircle size={16} className="spin shrink-0 text-accent" aria-hidden /> : <Favicon src={tab.favicon} url={tab.url} size={16} />}
      {!compact && (
        <>
          <span className={cx('min-w-0 flex-1 truncate text-small', active && 'font-medium')}>{title}</span>
          {tab.audible || tab.muted ? (
            <button type="button" aria-label={t(tab.muted ? 'tab.unmute' : 'tab.mute')} title={t(tab.muted ? 'tab.unmute' : 'tab.mute')} onClick={(e) => { e.stopPropagation(); send({ type: 'mute', id: tab.id }); }} className="shrink-0 text-fg-3 hover:text-fg">
              {tab.muted ? <VolumeX size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
            </button>
          ) : null}
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('tab.close')}
            title={t('tab.close')}
            onClick={(e) => { e.stopPropagation(); send({ type: 'close', id: tab.id }); }}
            className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-sm text-fg-3 hover:bg-pressed hover:text-fg', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
          >
            <X size={14} aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

export function TabStrip({ tabs, isPrivate, platform }: { tabs: TabsState; isPrivate: boolean; platform: string }) {
  const t = useT();
  const dragId = useRef<number | null>(null);
  const [, force] = useState(0);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const ids = tabs.tabs.map((x) => x.id);
    const idx = ids.indexOf(tabs.activeId ?? -1);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % ids.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ids.length - 1;
    if (next >= 0) {
      e.preventDefault();
      send({ type: 'activate', id: ids[next] });
      requestAnimationFrame(() => (document.querySelector(`[data-tab-id="${ids[next]}"]`) as HTMLElement | null)?.focus());
    }
  };

  return (
    <div
      className="drag flex h-10 shrink-0 items-end gap-0.5 bg-chrome pl-2"
      style={platform === 'win32' ? { paddingRight: 'calc(100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw))' } : undefined}
    >
      {isPrivate && (
        <div className="no-drag mb-1 mr-1 flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-accent-subtle px-2 text-small font-medium text-accent">
          <EyeOff size={14} aria-hidden /> Private
        </div>
      )}
      <div className="flex min-w-0 items-end gap-0.5">
        <div role="tablist" aria-label="Tabs" onKeyDown={onKeyDown} className="flex min-w-0 items-end gap-0.5 overflow-hidden">
          {tabs.tabs.map((tab, i) => (
            <TabItem
              key={tab.id}
              tab={tab}
              active={tab.id === tabs.activeId}
              onDragStart={() => { dragId.current = tab.id; }}
              onDrop={() => { if (dragId.current !== null && dragId.current !== tab.id) send({ type: 'move', id: dragId.current, index: i }); dragId.current = null; force((n) => n + 1); }}
            />
          ))}
        </div>
        <IconButton icon={Plus} label={t('tab.newBtn')} size={16} className="mb-[3px] h-7 w-7" onClick={() => send({ type: 'create' })} />
      </div>
    </div>
  );
}
