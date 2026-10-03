import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke, useT } from '../../lib/bridge';
import { Button, Group, IconButton, Row } from '../../lib/ui';
import type { MessageKey } from '../../../shared/i18n';

interface Perm { origin: string; permission: string; decision: 'allow' | 'block' }
const LABELS: Record<string, MessageKey> = {
  media: 'perm.label.media', geolocation: 'perm.label.geolocation', notifications: 'perm.label.notifications', 'clipboard-read': 'perm.label.clipboard',
};

function ClearDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [opts, setOpts] = useState({ history: true, cookiesAndSiteData: true, cache: true, passwords: false, sitePermissions: false });
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const items: { key: keyof typeof opts; label: MessageKey }[] = [
    { key: 'history', label: 'clear.history' },
    { key: 'cookiesAndSiteData', label: 'clear.cookies' },
    { key: 'cache', label: 'clear.cache' },
    { key: 'passwords', label: 'clear.passwords' },
    { key: 'sitePermissions', label: 'clear.permissions' },
  ];
  const any = Object.values(opts).some(Boolean);
  const run = async () => { setBusy(true); await invoke('data:clear', opts); setBusy(false); onDone(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="clear-title" className="flex w-full max-w-[460px] flex-col gap-4 rounded-xl border border-line-subtle bg-raised p-6 shadow-dialog">
        <h2 id="clear-title" className="m-0 text-title font-semibold text-fg">{t('privacy.clearData')}</h2>
        <div className="flex flex-col gap-1">
          {items.map((it, i) => (
            <label key={it.key} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-body text-fg hover:bg-hover">
              <input ref={i === 0 ? first : undefined} type="checkbox" checked={opts[it.key]} onChange={(e) => setOpts({ ...opts, [it.key]: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--c-accent))]" />
              {t(it.label)}
            </label>
          ))}
        </div>
        <p className="m-0 text-small text-fg-3">{t('clear.note')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" disabled={!any || busy} onClick={() => void run()}>{t('common.clear')}</Button>
        </div>
      </div>
    </div>
  );
}

export function DataSection() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [perms, setPerms] = useState<Perm[]>([]);
  const load = useCallback(() => { void invoke<{ items: Perm[] }>('permissions:list').then((r) => setPerms(r.items)); }, []);
  useEffect(load, [load]);

  return (
    <>
      <Group label={t('privacy.group.data')}>
        <Row title={t('privacy.clearData')} desc={done ? t('clear.done') : t('privacy.clearData.desc')}>
          <Button onClick={() => { setDone(false); setOpen(true); }}>{t('privacy.clearBtn')}</Button>
        </Row>
      </Group>

      <Group label={t('privacy.permissions')}>
        {perms.length === 0 ? (
          <Row title={t('privacy.permissions.empty')} desc={t('privacy.permissions.desc')} />
        ) : (
          <>
            {perms.map((p) => (
              <Row key={`${p.origin}|${p.permission}`} title={p.origin.replace(/^https?:\/\//, '')} desc={`${t(LABELS[p.permission] ?? 'perm.label.other')} · ${p.decision === 'allow' ? t('perm.allow') : t('perm.block')}`}>
                <IconButton icon={Trash2} label={t('common.delete')} onClick={() => { void invoke('permissions:clear', { origin: p.origin, permission: p.permission }).then(load); }} />
              </Row>
            ))}
            <Row title={t('privacy.permissions.clearAll')}>
              <Button variant="danger" onClick={() => { void invoke('permissions:clear').then(load); }}>{t('common.clear')}</Button>
            </Row>
          </>
        )}
      </Group>

      {open && <ClearDialog onClose={() => setOpen(false)} onDone={() => { setDone(true); load(); }} />}
    </>
  );
}
