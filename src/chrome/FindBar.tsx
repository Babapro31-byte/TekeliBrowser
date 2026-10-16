import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { invoke, on, useT } from '../lib/bridge';
import { IconButton } from '../lib/ui';
import type { FindResult } from '../types/tekeli';

export function FindBar({ onClose }: { onClose: () => void }) {
  const t = useT();
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<FindResult | null>(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  useEffect(() => on<FindResult>('find:result', setResult), []);

  const find = (value: string, forward = true, next = false) => {
    if (!value) { setResult(null); void invoke('find:do', { stop: true }); return; }
    void invoke('find:do', { text: value, forward, next });
  };

  const submit = (e: FormEvent) => { e.preventDefault(); find(text, true, true); };

  return (
    <form onSubmit={submit} className="no-drag flex h-10 shrink-0 items-center justify-end gap-2 border-b border-line-subtle bg-toolbar px-3">
      <div className="flex h-8 w-72 items-center gap-2 rounded-md border border-line bg-field px-3 focus-within:border-accent">
        <input
          ref={ref}
          value={text}
          aria-label={t('find.placeholder')}
          placeholder={t('find.placeholder')}
          onChange={(e) => { setText(e.target.value); find(e.target.value); }}
          className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3"
        />
        <span className="shrink-0 text-small text-fg-3" aria-live="polite">
          {text && result ? (result.matches === 0 ? t('find.noMatch') : `${result.activeMatchOrdinal}/${result.matches}`) : ''}
        </span>
      </div>
      <IconButton icon={ChevronUp} label={t('find.prev')} onClick={() => find(text, false, true)} />
      <IconButton icon={ChevronDown} label={t('find.next')} onClick={() => find(text, true, true)} />
      <IconButton icon={X} label={t('find.close')} onClick={onClose} />
    </form>
  );
}
