import { Bookmark, Clock, Globe, Search } from 'lucide-react';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import { invoke, on } from '../lib/bridge';
import { cx } from '../lib/ui';

export interface SuggestRow { kind: 'search' | 'url' | 'history' | 'bookmark'; text: string; title?: string }
interface OverlayData { kind: 'suggest'; rows: SuggestRow[]; selected: number }

const ICONS = { search: Search, url: Globe, history: Clock, bookmark: Bookmark } as const;

function Suggest({ data }: { data: OverlayData }) {
  return (
    <ul role="listbox" aria-label="Suggestions" className="m-0 flex h-full list-none flex-col overflow-hidden rounded-lg border border-line bg-raised p-1">
      {data.rows.map((r, i) => {
        const Icon = ICONS[r.kind];
        const on = i === data.selected;
        return (
          <li key={`${r.kind}-${r.text}-${i}`} role="option" aria-selected={on}>
            <button
              type="button"
              tabIndex={-1}
              // Pick on mousedown: the chrome input blurs as soon as this view is clicked.
              onMouseDown={(e) => { e.preventDefault(); void invoke('overlay:pick', { kind: 'suggest', index: i }); }}
              className={cx('flex h-10 w-full items-center gap-3 rounded-md px-3 text-left', on ? 'bg-hover' : 'hover:bg-hover')}
            >
              <Icon size={16} className="shrink-0 text-fg-3" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-body text-fg">{r.title || r.text}</span>
              {r.title && <span className="max-w-[45%] truncate text-small text-fg-3">{r.text}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Overlay() {
  const [data, setData] = useState<OverlayData | null>(null);
  useEffect(() => on<OverlayData | null>('overlay:data', setData), []);
  if (!data) return null;
  return <Suggest data={data} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Overlay />
  </StrictMode>,
);
