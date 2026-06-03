import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
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

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      try {
        const initial = await window.electron?.getDownloads?.();
        if (mounted && initial) {
          setDownloads(initial.sort((a, b) => b.startedAt - a.startedAt));
        }
      } catch (err) {
        console.error('Failed to load downloads', err);
      }
    };
    loadInitial();

    const cleanup = window.electron?.onDownloadUpdated?.((record: DownloadRecord) => {
      if (!mounted) return;
      setDownloads(prev => {
        const idx = prev.findIndex(d => d.id === record.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next;
        }
        return [record, ...prev].sort((a, b) => b.startedAt - a.startedAt);
      });
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  const hasDownloads = downloads.length > 0;

  const summary = useMemo(() => {
    const active = downloads.filter(d => d.state === 'starting' || d.state === 'progressing').length;
    const done = downloads.filter(d => d.state === 'completed').length;
    const failed = downloads.filter(d => d.state === 'cancelled' || d.state === 'interrupted').length;
    return { active, done, failed };
  }, [downloads]);

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-glass-glow" style={{ background: 'linear-gradient(135deg, rgba(255,191,0,0.2), rgba(250,92,28,0.2))' }}>
            <Download size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline text-on-surface">Indirmeler</h1>
            <div className="flex gap-4 mt-2">
              <span className={`text-sm flex items-center gap-1 ${summary.active > 0 ? 'text-primary font-medium' : 'text-outline'}`}>
                <Loader2 size={14} className={summary.active > 0 ? 'animate-spin' : ''} /> {summary.active} Aktif
              </span>
              <span className={`text-sm flex items-center gap-1 ${summary.done > 0 ? 'text-primary font-medium' : 'text-outline'}`}>
                <CheckCircle2 size={14} /> {summary.done} Tamamlandi
              </span>
              <span className={`text-sm flex items-center gap-1 ${summary.failed > 0 ? 'text-error font-medium' : 'text-outline'}`}>
                <AlertCircle size={14} /> {summary.failed} Hata
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!hasDownloads ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-outline/10 rounded-3xl bg-surface-container-low/30">
              <div className="w-16 h-16 rounded-full bg-surface-container-high/20 flex items-center justify-center text-outline mb-4">
                <Download size={32} />
              </div>
              <h3 className="text-lg font-medium text-on-surface">Henüz bir indirme yok</h3>
              <p className="text-sm text-outline mt-2 max-w-sm">Indirdiginiz dosyalar burada listelenecektir.</p>
            </div>
          ) : (
            downloads.map((d) => {
              const total = d.totalBytes;
              const received = d.receivedBytes;
              const pct = total > 0 ? Math.min(100, Math.max(0, (received / total) * 100)) : null;
              const title = d.filename || d.url;
              
              const isDone = d.state === 'completed';
              const isError = d.state === 'cancelled' || d.state === 'interrupted';
              const isActive = d.state === 'progressing' || d.state === 'starting';

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={d.id}
                  className="relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 bg-surface-container-low/50 border-outline/5 hover:border-outline/10"
                >
                  <div className="flex items-start gap-4">
                    
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isDone ? 'bg-primary-container/20 text-primary-container' : 
                        isError ? 'bg-error/20 text-error' : 
                        'bg-primary-container/20 text-primary-container'}
                    `}>
                      {isDone ? <CheckCircle2 size={20} /> :
                       isError ? <XCircle size={20} /> :
                       <Download size={20} className={isActive ? 'animate-bounce' : ''} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-on-surface truncate text-base">{title}</h3>
                          <p className="text-xs text-outline truncate mt-1">{d.savePath || d.url}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${isDone ? 'bg-primary-container/20 text-primary-container' : 
                            isError ? 'bg-error/20 text-error' : 
                            'bg-primary-container/20 text-primary-container'}
                        `}>
                          {isDone && 'Tamamlandi'}
                          {d.state === 'progressing' && 'Indiriliyor'}
                          {d.state === 'starting' && 'Baslatiliyor'}
                          {d.state === 'cancelled' && 'Iptal edildi'}
                          {d.state === 'interrupted' && 'Hata'}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="h-1.5 rounded-full overflow-hidden bg-surface-container-highest relative">
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"
                            />
                          )}
                          <div
                            className="h-full transition-all duration-300 rounded-full flare-gradient"
                            style={{ width: `${pct ?? (isDone ? 100 : 0)}%`, opacity: pct === null && !isDone ? 0 : 1 }}
                          />
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-outline font-medium">
                          <div>
                            {formatBytes(received)} / {formatBytes(total)}
                          </div>
                          <div>
                            {pct === null ? (isDone ? '100%' : '—') : `${pct.toFixed(0)}%`}
                          </div>
                        </div>

                        {d.error && (
                          <div className="mt-3 text-xs text-error bg-error/10 p-2 rounded-lg inline-flex items-center gap-1">
                            <AlertCircle size={12} /> {d.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;