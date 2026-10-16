import { Bell, Camera, Clipboard, Lock, MapPin, Mic, ShieldQuestion, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { invoke, on, useT } from '../lib/bridge';
import { Button } from '../lib/ui';
import type { MessageKey } from '../../shared/i18n';

interface Pending { id: string; origin: string; permission: string; media: string[] }

function describe(p: Pending): { icon: LucideIcon; key: MessageKey } {
  if (p.permission === 'media') {
    const video = p.media.includes('video');
    const audio = p.media.includes('audio');
    if (video && audio) return { icon: Camera, key: 'perm.cameraMic' };
    if (video) return { icon: Camera, key: 'perm.camera' };
    return { icon: Mic, key: 'perm.mic' };
  }
  switch (p.permission) {
    case 'geolocation': return { icon: MapPin, key: 'perm.location' };
    case 'notifications': return { icon: Bell, key: 'perm.notifications' };
    case 'clipboard-read': return { icon: Clipboard, key: 'perm.clipboard' };
    default: return { icon: ShieldQuestion, key: 'perm.other' };
  }
}

export function PermissionBar() {
  const t = useT();
  const [list, setList] = useState<Pending[]>([]);
  useEffect(() => {
    void invoke<{ items: Pending[] }>('permissions:pending').then((r) => setList(r.items));
    return on<Pending[]>('permissions:state', setList);
  }, []);
  const p = list[0];
  if (!p) return null;
  const { icon: Icon, key } = describe(p);
  let host = p.origin;
  try { host = new URL(p.origin).host; } catch { /* keep origin */ }
  const respond = (allow: boolean, remember = true) => void invoke('permissions:respond', { id: p.id, allow, remember });

  return (
    <div role="alertdialog" aria-label={t(key)} className="no-drag flex h-11 shrink-0 items-center gap-3 border-b border-line-subtle bg-accent-subtle px-4">
      <Lock size={14} className="text-fg-3" aria-hidden />
      <Icon size={18} className="text-accent" aria-hidden />
      <p className="m-0 min-w-0 flex-1 truncate text-body text-fg"><strong className="font-semibold">{host}</strong> {t(key)}</p>
      {list.length > 1 && <span className="text-small text-fg-2">+{list.length - 1}</span>}
      <Button variant="ghost" onClick={() => respond(false, false)}>{t('perm.notNow')}</Button>
      <Button variant="secondary" onClick={() => respond(false)}>{t('perm.block')}</Button>
      <Button variant="primary" onClick={() => respond(true)}>{t('perm.allow')}</Button>
    </div>
  );
}
