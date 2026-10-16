import { CircleCheck, Download, RefreshCw, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { boot, invoke, updateSettings, useBridgeEvent, useSettings, useT, useLang } from '../../lib/bridge';
import { Button, Group, PageHeader, Row, Select, Toggle, cx } from '../../lib/ui';

interface UpdateState { status: 'disabled' | 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'not-available' | 'error'; version?: string; percent?: number; transferred?: number; total?: number; checkedAt?: number; error?: string }

const mb = (n?: number) => `${((n ?? 0) / 1048576).toFixed(0)} MB`;

function Circle({ icon: Icon, tone }: { icon: LucideIcon; tone: 'ok' | 'accent' | 'danger' }) {
  return (
    <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', tone === 'ok' ? 'bg-ok-subtle text-ok' : tone === 'danger' ? 'bg-danger-subtle text-danger' : 'bg-accent-subtle text-accent')}>
      <Icon size={18} aria-hidden />
    </span>
  );
}

export function Updates() {
  const t = useT();
  const lang = useLang();
  const s = useSettings();
  const [u, setU] = useState<UpdateState>({ status: 'idle' });
  useEffect(() => { void invoke<UpdateState>('update:state').then(setU); }, []);
  useBridgeEvent('update:state', useCallback((next: UpdateState) => setU(next), []));

  const when = u.checkedAt ? new Date(u.checkedAt).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : null;
  const check = () => void invoke('update:check');

  let row;
  switch (u.status) {
    case 'checking':
      row = <Row leading={<Circle icon={RefreshCw} tone="accent" />} title={t('update.checking')} />;
      break;
    case 'available':
      row = (
        <Row leading={<Circle icon={Download} tone="accent" />} title={`${t('update.available')} · v${u.version}`} desc={t('update.available.desc')}>
          <Button variant="primary" onClick={() => void invoke('update:download')}>{t('update.download')}</Button>
        </Row>
      );
      break;
    case 'downloading':
      row = (
        <Row leading={<Circle icon={Download} tone="accent" />} title={`${t('update.downloading')} · v${u.version ?? ''}`} desc={`${u.percent ?? 0}% · ${mb(u.transferred)} / ${mb(u.total)}`} />
      );
      break;
    case 'ready':
      row = (
        <Row leading={<Circle icon={RefreshCw} tone="accent" />} title={`${t('update.ready')} · v${u.version}`} desc={t('update.ready.desc')}>
          <Button variant="primary" onClick={() => void invoke('update:install')}>{t('update.restart')}</Button>
        </Row>
      );
      break;
    case 'error':
      row = (
        <Row leading={<Circle icon={TriangleAlert} tone="danger" />} title={t('update.error')} desc={u.error}>
          <Button onClick={check}>{t('update.check')}</Button>
        </Row>
      );
      break;
    case 'disabled':
      row = <Row leading={<Circle icon={CircleCheck} tone="ok" />} title={`TekeliBrowser v${boot.version}`} desc={t('update.devMode')} />;
      break;
    default:
      row = (
        <Row leading={<Circle icon={CircleCheck} tone="ok" />} title={t('update.current')} desc={`v${boot.version}${when ? ` · ${t('update.lastCheck')} ${when}` : ''}`}>
          <Button onClick={check}>{t('update.check')}</Button>
        </Row>
      );
  }

  return (
    <>
      <PageHeader title={t('settings.updates')} desc={t('update.desc')} />
      <Group label={t('update.status')}>
        {row}
        {u.status === 'downloading' && (
          <div className="px-4 pb-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-pressed" role="progressbar" aria-valuenow={u.percent ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-accent transition-[width] duration-slow" style={{ width: `${u.percent ?? 0}%` }} />
            </div>
          </div>
        )}
      </Group>
      <Group label={t('update.prefs')}>
        <Row title={t('update.auto')} desc={t('update.auto.desc')}>
          <Toggle label={t('update.auto')} checked={s.updateAutoDownload} onChange={(v) => void updateSettings({ updateAutoDownload: v })} />
        </Row>
        <Row title={t('update.channel')} desc={t('update.channel.desc')}>
          <Select label={t('update.channel')} width={160} value={s.updateChannel} onChange={(v) => void updateSettings({ updateChannel: v })}
            options={[{ value: 'stable', label: t('update.stable') }, { value: 'beta', label: 'Beta' }]} />
        </Row>
      </Group>
    </>
  );
}
