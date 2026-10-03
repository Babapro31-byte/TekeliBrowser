import { ShieldAlert, WifiOff, type LucideIcon } from 'lucide-react';
import { invoke, useT } from '../lib/bridge';
import { Button, cx } from '../lib/ui';
import type { MessageKey } from '../../shared/i18n';

type Kind = 'load' | 'crash' | 'https' | 'cert';

const KINDS: Record<Kind, { icon: LucideIcon; tone: 'warn' | 'danger'; title: MessageKey; body: MessageKey; back: MessageKey; cont?: MessageKey }> = {
  load: { icon: WifiOff, tone: 'warn', title: 'error.load.title', body: 'error.load.body', back: 'error.load.retry' },
  crash: { icon: WifiOff, tone: 'danger', title: 'error.load.title', body: 'error.load.body', back: 'error.load.retry' },
  https: { icon: ShieldAlert, tone: 'warn', title: 'error.https.title', body: 'error.https.body', back: 'error.https.back', cont: 'error.https.continue' },
  cert: { icon: ShieldAlert, tone: 'danger', title: 'error.cert.title', body: 'error.cert.body', back: 'error.cert.back', cont: 'error.cert.continue' },
};

const safeHttp = (u: string | null): string | null => (u && /^https?:\/\//i.test(u) ? u : null);

export function ErrorPage() {
  const t = useT();
  const p = new URLSearchParams(location.search);
  const kind = (['load', 'crash', 'https', 'cert'].includes(p.get('kind') ?? '') ? p.get('kind') : 'load') as Kind;
  const url = safeHttp(p.get('url'));
  const detail = [p.get('desc'), p.get('code') ? `ERR ${p.get('code')}` : null, url ? new URL(url).host : null].filter(Boolean).join(' · ');
  const k = KINDS[kind];
  const Icon = k.icon;

  const primary = () => {
    if (kind === 'load' || kind === 'crash') { if (url) void invoke('tabs:do', { type: 'navigate', input: url }); else void invoke('tabs:do', { type: 'home' }); }
    else void invoke('tabs:do', { type: 'back' });
  };

  return (
    <main className="grid h-full place-items-center bg-app px-6">
      <div className="flex w-full max-w-[560px] flex-col gap-4 rounded-xl border border-line-subtle bg-surface p-8">
        <div className={cx('grid h-14 w-14 place-items-center rounded-full', k.tone === 'danger' ? 'bg-danger-subtle text-danger' : 'bg-warn-subtle text-warn')}>
          <Icon size={28} aria-hidden />
        </div>
        <h1 className="m-0 text-heading font-semibold text-fg">{t(k.title)}</h1>
        <p className="m-0 text-body text-fg-2">{t(k.body)}</p>
        {detail && <p className="m-0 rounded-md bg-field px-3 py-2 text-small text-fg-3 break-all">{detail}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="primary" onClick={primary}>{t(k.back)}</Button>
          {k.cont && url && (
            <Button
              variant={k.tone === 'danger' ? 'danger' : 'ghost'}
              onClick={() => void invoke('tabs:do', { type: kind === 'cert' ? 'allow-cert' : 'allow-http', url })}
            >
              {t(k.cont)}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
