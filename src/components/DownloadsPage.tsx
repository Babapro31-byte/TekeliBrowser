import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { DownloadRecord } from '../types/electron';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

const DownloadsPage = () => {
  const [urlInput, setUrlInput] = useState('');
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await window.electron?.getDownloads?.();
        if (mounted && Array.isArray(list)) {
          setDownloads(list);
        }
      } catch {}
    };
    load();

    const cleanup = window.electron?.onDownloadUpdated?.((rec) => {
      if (!mounted) return;
      setDownloads((prev) => {
        const idx = prev.findIndex((d) => d.id === rec.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = rec;
          next.sort((a, b) => b.startedAt - a.startedAt);
          return next;
        }
        return [rec, ...prev].sort((a, b) => b.startedAt - a.startedAt);
      });
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  const handleStart = async () => {
    setError(null);
    const url = normalizeUrl(urlInput);
    if (!url) return;

    try {
      const res = await window.electron?.startDownload?.(url);
      if (!res?.success) {
        setError(res?.error || 'İndirme başlatılamadı');
        return;
      }
      setUrlInput('');
    } catch {
      setError('İndirme başlatılamadı');
    }
  };

  const hasDownloads = downloads.length > 0;

  const summary = useMemo(() => {
    const active = downloads.filter(d => d.state === 'starting' || d.state === 'progressing').length;
    const done = downloads.filter(d => d.state === 'completed').length;
    const failed = downloads.filter(d => d.state === 'cancelled' || d.state === 'interrupted').length;
    return { active, done, failed };
  }, [downloads]);

  return (
    <div className="w-full h-full bg-dark-bg overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white/90">İndirmeler</h1>
            <p className="text-sm text-white/50 mt-1">
              Aktif: {summary.active} · Tamamlandı: {summary.done} · Hata: {summary.failed}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-dark-surface/50 border border-neon-blue/10 rounded-2xl p-4">
          <div className="flex gap-3">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
              placeholder="İndirilecek URL (https://...)"
              className="flex-1 h-11 px-4 rounded-xl bg-dark-bg/60 border border-white/10 text-white/90 outline-none focus:border-neon-blue/40"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="h-11 px-5 rounded-xl bg-neon-blue/20 hover:bg-neon-blue/25 border border-neon-blue/30 text-neon-blue font-medium"
            >
              İndir
            </motion.button>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="mt-3 text-xs text-white/40">
            Dosyalar varsayılan İndirilenler klasörüne kaydedilir.
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {!hasDownloads && (
            <div className="text-white/50 text-sm">
              Henüz bir indirme yok.
            </div>
          )}

          {downloads.map((d) => {
            const total = d.totalBytes;
            const received = d.receivedBytes;
            const pct = total > 0 ? Math.min(100, Math.max(0, (received / total) * 100)) : null;
            const title = d.filename || d.url;

            return (
              <div
                key={d.id}
                className="bg-dark-surface/40 border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-white/90 font-medium truncate">{title}</div>
                    <div className="text-xs text-white/40 mt-1 truncate">
                      {d.savePath || d.url}
                    </div>
                  </div>
                  <div className="text-xs text-white/60 whitespace-nowrap">
                    {d.state === 'completed' && 'Tamamlandı'}
                    {d.state === 'progressing' && 'İndiriliyor'}
                    {d.state === 'starting' && 'Başlatılıyor'}
                    {d.state === 'cancelled' && 'İptal edildi'}
                    {d.state === 'interrupted' && 'Hata'}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 rounded-full bg-dark-bg/60 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                      style={{ width: `${pct ?? 0}%`, opacity: pct === null ? 0.3 : 1 }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/45">
                    <div>
                      {formatBytes(received)} / {formatBytes(total)}
                    </div>
                    <div>
                      {pct === null ? '—' : `${pct.toFixed(0)}%`}
                    </div>
                  </div>
                  {d.error && (
                    <div className="mt-2 text-xs text-red-400">
                      {d.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;

