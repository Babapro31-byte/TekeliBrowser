import { Copy, Eye, EyeOff, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { invoke, useT } from '../../lib/bridge';
import { Button, Favicon, Group, IconButton, PageHeader, Row } from '../../lib/ui';

interface Entry { id: number; origin: string; username: string; createdAt: number; updatedAt: number }

function Item({ e, onDeleted }: { e: Entry; onDeleted: () => void }) {
  const t = useT();
  const [shown, setShown] = useState<string | null>(null);
  const reveal = async () => {
    if (shown !== null) { setShown(null); return; }
    const r = await invoke<{ password: string | null }>('password-reveal', e.id);
    setShown(r.password ?? '');
    setTimeout(() => setShown(null), 15_000); // never leave a password on screen
  };
  const copy = async () => {
    const r = await invoke<{ password: string | null }>('password-reveal', e.id);
    if (r.password) void invoke('app:copy', r.password);
  };
  let host = e.origin;
  try { host = new URL(e.origin).host; } catch { /* keep */ }
  return (
    <Row leading={<Favicon url={e.origin} size={28} />} title={host} desc={`${e.username}${shown !== null ? `  ·  ${shown}` : '  ·  ••••••••••'}`}>
      <IconButton icon={shown !== null ? EyeOff : Eye} label={t(shown !== null ? 'passwords.hide' : 'passwords.show')} onClick={() => void reveal()} />
      <IconButton icon={Copy} label={t('passwords.copy')} onClick={() => void copy()} />
      <IconButton icon={Trash2} label={t('common.delete')} onClick={() => { void invoke('password-delete', e.id).then(onDeleted); }} />
    </Row>
  );
}

export function Passwords() {
  const t = useT();
  const [items, setItems] = useState<Entry[]>([]);
  const [available, setAvailable] = useState(true);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ origin: '', username: '', password: '' });
  const [err, setErr] = useState('');

  const load = useCallback(() => { void invoke<{ passwords: Entry[] }>('password-list', q).then((r) => setItems(r.passwords)); }, [q]);
  useEffect(() => { void invoke<{ available: boolean }>('password-available').then((r) => setAvailable(r.available)); }, []);
  useEffect(() => { const h = setTimeout(load, 150); return () => clearTimeout(h); }, [load]);

  const add = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr('');
    try {
      const origin = /^https?:\/\//i.test(form.origin) ? form.origin : `https://${form.origin}`;
      await invoke('password-add', origin, form.username, form.password);
      setForm({ origin: '', username: '', password: '' });
      setAdding(false);
      load();
    } catch { setErr(t('passwords.addFailed')); }
  };

  const field = 'h-8 min-w-0 flex-1 rounded-md border border-line bg-field px-3 text-body text-fg outline-none placeholder:text-fg-3 focus-visible:border-accent';

  return (
    <>
      <PageHeader title={t('settings.passwords')} desc={t('passwords.desc')} />
      <div className="flex items-center gap-3 rounded-lg bg-accent-subtle px-4 py-3 text-small text-fg">
        <ShieldCheck size={20} className="shrink-0 text-accent" aria-hidden />
        <span>{available ? t('passwords.banner') : t('passwords.unavailable')}</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex h-8 flex-1 items-center gap-2 rounded-md border border-line bg-field px-3 focus-within:border-accent">
          <Search size={16} className="text-fg-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('passwords.search')} aria-label={t('passwords.search')} className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3" />
        </label>
        <Button disabled={!available} onClick={() => setAdding((v) => !v)}>{t('passwords.add')}</Button>
      </div>
      {adding && (
        <form onSubmit={(e) => void add(e)} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface p-4">
          <div className="flex gap-2">
            <input required className={field} placeholder={t('passwords.site')} aria-label={t('passwords.site')} value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
            <input required className={field} placeholder={t('passwords.username')} aria-label={t('passwords.username')} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
            <input required type="password" className={field} placeholder={t('passwords.password')} aria-label={t('passwords.password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </div>
          {err && <p className="m-0 text-small text-danger" role="alert">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit">{t('passwords.save')}</Button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <p className="m-0 py-10 text-center text-body text-fg-3">{t('passwords.empty')}</p>
      ) : (
        <Group>{items.map((e) => <Item key={e.id} e={e} onDeleted={load} />)}</Group>
      )}
    </>
  );
}
