import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { invoke, on, useT } from '../lib/bridge';
import { Button, Select } from '../lib/ui';

type Prompt =
  | { kind: 'save'; origin: string; username: string; update: boolean }
  | { kind: 'fill'; origin: string; accounts: { id: number; username: string }[] };

function Fill({ p }: { p: Extract<Prompt, { kind: 'fill' }> }) {
  const t = useT();
  const [id, setId] = useState(String(p.accounts[0]?.id ?? ''));
  useEffect(() => setId(String(p.accounts[0]?.id ?? '')), [p]);
  let host = p.origin;
  try { host = new URL(p.origin).host; } catch { /* keep */ }
  return (
    <div role="alertdialog" aria-label={t('pwfill.title')} className="no-drag flex h-11 shrink-0 items-center gap-3 border-b border-line-subtle bg-accent-subtle px-4">
      <KeyRound size={18} className="text-accent" aria-hidden />
      <p className="m-0 min-w-0 flex-1 truncate text-body text-fg">
        {t('pwfill.title').replace('%s', host)}
        {p.accounts.length === 1 && <span className="text-fg-2"> ({p.accounts[0].username})</span>}
      </p>
      {p.accounts.length > 1 && (
        <Select value={id} onChange={setId} label={t('pwfill.title').replace('%s', host)} width={200} options={p.accounts.map((a) => ({ value: String(a.id), label: a.username }))} />
      )}
      <Button variant="ghost" onClick={() => void invoke('password:fill-dismiss')}>{t('perm.notNow')}</Button>
      <Button variant="primary" onClick={() => void invoke('password:fill', Number(id))}>{t('pwfill.fill')}</Button>
    </div>
  );
}

export function SavePasswordBar() {
  const t = useT();
  const [p, setP] = useState<Prompt | null>(null);
  useEffect(() => {
    void invoke<Prompt | null>('password:pending').then(setP);
    return on<Prompt | null>('password:prompt', setP);
  }, []);
  if (!p) return null;
  if (p.kind === 'fill') return <Fill p={p} />;
  let host = p.origin;
  try { host = new URL(p.origin).host; } catch { /* keep */ }
  return (
    <div role="alertdialog" aria-label={t('pwsave.title')} className="no-drag flex h-11 shrink-0 items-center gap-3 border-b border-line-subtle bg-accent-subtle px-4">
      <KeyRound size={18} className="text-accent" aria-hidden />
      <p className="m-0 min-w-0 flex-1 truncate text-body text-fg">
        {t(p.update ? 'pwsave.update' : 'pwsave.title').replace('%s', host)} <span className="text-fg-2">({p.username})</span>
      </p>
      <Button variant="ghost" onClick={() => void invoke('password:respond', false)}>{t('perm.notNow')}</Button>
      <Button variant="primary" onClick={() => void invoke('password:respond', true)}>{t(p.update ? 'pwsave.updateBtn' : 'passwords.save')}</Button>
    </div>
  );
}
