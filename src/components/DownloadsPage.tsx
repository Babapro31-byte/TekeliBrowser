import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, File, AlertCircle, CheckCircle2, Loader2, XCircle, Search } from 'lucide-react';
import type { DownloadRecord } from '../types/electron';
import type { ThemeDef, ThemeId } from '../utils/themes';

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

interface DownloadsPageProps {
  activeTheme?: ThemeDef;
  activeThemeId?: ThemeId;
}

const DownloadsPage = ({ activeTheme: _activeTheme, activeThemeId }: DownloadsPageProps) => {
  const isLight = activeThemeId === 'light';
  const [urlInput, setUrlInput] = useState('');
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    <div className={`w-full h-full overflow-y-auto scrollbar-hide ${isLight ? 'bg-slate-50' : 'bg-bg-primary'}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue shadow-glass-glow">
            <Download size={24} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>İndirmeler</h1>
            <div className="flex gap-4 mt-2">
              <span className={`text-sm flex items-center gap-1 ${summary.active > 0 ? 'text-accent-blue font-medium' : 'text-gray-500'}`}>
                <Loader2 size={14} className={summary.active > 0 ? 'animate-spin' : ''} /> {summary.active} Aktif
              </span>
              <span className={`text-sm flex items-center gap-1 ${summary.done > 0 ? 'text-accent-green font-medium' : 'text-gray-500'}`}>
                <CheckCircle2 size={14} /> {summary.done} Tamamlandı
              </span>
              <span className={`text-sm flex items-center gap-1 ${summary.failed > 0 ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                <AlertCircle size={14} /> {summary.failed} Hata
              </span>
            </div>
          </div>
        </div>

        {/* Input Section - Floating Island */}
        <div className="mb-10 bg-bg-secondary/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-glass">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStart();
                }}
                placeholder="İndirilecek URL (https://...)"
                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-transparent transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="h-12 px-8 rounded-2xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-shadow"
            >
              İndir
            </motion.button>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
          <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <File size={12} /> Dosyalar varsayılan İndirilenler klasörüne kaydedilir.
          </p>
        </div>

        {/* Downloads List */}
        <div className="space-y-4">
          {!hasDownloads ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-bg-secondary/30">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4">
                <Download size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-300">Henüz bir indirme yok</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">İndirdiğiniz dosyalar burada listelenecektir.</p>
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
                  className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-300
                    ${isActive ? 'bg-bg-secondary/90 border-accent-blue/30 shadow-glass-active' : 'bg-bg-secondary/50 border-white/5 hover:border-white/10 hover:bg-bg-secondary/80'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isDone ? 'bg-accent-green/20 text-accent-green' : 
                        isError ? 'bg-red-400/20 text-red-400' : 
                        'bg-accent-blue/20 text-accent-blue'}
                    `}>
                      {isDone ? <CheckCircle2 size={20} /> :
                       isError ? <XCircle size={20} /> :
                       <Download size={20} className={isActive ? 'animate-bounce' : ''} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate text-base">{title}</h3>
                          <p className="text-xs text-gray-500 truncate mt-1">{d.savePath || d.url}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${isDone ? 'bg-accent-green/20 text-accent-green' : 
                            isError ? 'bg-red-400/20 text-red-400' : 
                            'bg-accent-blue/20 text-accent-blue'}
                        `}>
                          {isDone && 'Tamamlandı'}
                          {d.state === 'progressing' && 'İndiriliyor'}
                          {d.state === 'starting' && 'Başlatılıyor'}
                          {d.state === 'cancelled' && 'İptal edildi'}
                          {d.state === 'interrupted' && 'Hata'}
                        </div>
                      </div>

                      {/* Progress Area */}
                      <div className="mt-4">
                        <div className="h-1.5 rounded-full overflow-hidden bg-black/40 relative">
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"
                            />
                          )}
                          <div
                            className={`h-full transition-all duration-300 rounded-full
                              ${isDone ? 'bg-accent-green' : 
                                isError ? 'bg-red-400' : 
                                'bg-gradient-to-r from-accent-blue to-accent-purple'}
                            `}
                            style={{ width: `${pct ?? (isDone ? 100 : 0)}%`, opacity: pct === null && !isDone ? 0 : 1 }}
                          />
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 font-medium">
                          <div>
                            {formatBytes(received)} / {formatBytes(total)}
                          </div>
                          <div>
                            {pct === null ? (isDone ? '100%' : '—') : `${pct.toFixed(0)}%`}
                          </div>
                        </div>

                        {d.error && (
                          <div className="mt-3 text-xs text-red-400 bg-red-400/10 p-2 rounded-lg inline-flex items-center gap-1">
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

