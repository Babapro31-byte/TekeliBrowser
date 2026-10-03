import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { invoke, on, useT } from '../lib/bridge';
import { Button } from '../lib/ui';

interface Prompt { origin: string; username: string; update: boolean }

export function SavePasswordBar() {
  const t = useT();
  const [p, setP] = useState<Prompt | null>(null);
  useEffect(() => {
    void invoke<Prompt | null>('password:pending').then(setP);
    return on<Prompt | null>('password:prompt', setP);
  }, []);
  if (!p) return null;
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
