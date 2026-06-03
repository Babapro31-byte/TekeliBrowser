import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UpdateInfo, UpdateProgress } from '../types/electron';

type UpdateStatus = 
  | 'idle' 
  | 'checking' 
  | 'available' 
  | 'downloading' 
  | 'downloaded' 
  | 'error';

interface UpdateNotificationProps {
  onClose?: () => void;
}

const UpdateNotification = ({ onClose }: UpdateNotificationProps) => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Setup event listeners
  useEffect(() => {
    if (!window.electron) return;

    const cleanupFns: (() => void)[] = [];

    // Checking for updates
    cleanupFns.push(
      window.electron.onUpdateChecking(() => {
        setStatus('checking');
        setIsVisible(true);
      })
    );

    // Update available
    cleanupFns.push(
      window.electron.onUpdateAvailable((data) => {
        setStatus('available');
        setUpdateInfo(data);
        setIsVisible(true);
      })
    );

    // No update available
    cleanupFns.push(
      window.electron.onUpdateNotAvailable(() => {
        setStatus('idle');
        // Don't show notification if no update
        setTimeout(() => setIsVisible(false), 2000);
      })
    );

    // Download progress
    cleanupFns.push(
      window.electron.onUpdateDownloadProgress((data) => {
        setStatus('downloading');
        setProgress(data);
      })
    );

    // Update downloaded
    cleanupFns.push(
      window.electron.onUpdateDownloaded((data) => {
        setStatus('downloaded');
        setUpdateInfo(data);
        setProgress(null);
      })
    );

    // Error
    cleanupFns.push(
      window.electron.onUpdateError((data) => {
        setStatus('error');
        setError(data.message);
      })
    );

    // Cleanup on unmount
    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, []);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!window.electron) return;
    setStatus('downloading');
    await window.electron.downloadUpdate();
  }, []);

  // Handle install
  const handleInstall = useCallback(async () => {
    if (!window.electron) return;
    await window.electron.installUpdate();
  }, []);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  // Handle manual check
  const handleCheckForUpdates = useCallback(async () => {
    if (!window.electron) return;
    setStatus('checking');
    setIsVisible(true);
    await window.electron.checkForUpdates();
  }, []);

  // Format bytes to readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-20 right-4 z-prompt w-80"
      >
        <div className="relative overflow-hidden rounded-xl border border-outline/15 bg-surface-container-high/85 backdrop-blur-xl shadow-elev-3">
          {/* Subtle accent glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none" />

          {/* Header */}
          <div className="relative px-4 py-3 border-b border-outline/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Update icon */}
                <motion.div
                  animate={status === 'checking' || status === 'downloading' ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: status === 'checking' || status === 'downloading' ? Infinity : 0, ease: 'linear' }}
                  className="w-5 h-5 text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                </motion.div>
                <span className="text-sm font-medium text-on-surface">
                  {status === 'checking' && 'Güncelleme kontrol ediliyor...'}
                  {status === 'available' && 'Güncelleme mevcut!'}
                  {status === 'downloading' && 'İndiriliyor...'}
                  {status === 'downloaded' && 'İndirildi!'}
                  {status === 'error' && 'Hata'}
                </span>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                aria-label="Bildirimi kapat"
                className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative px-4 py-3">
            {/* Update Available */}
            {status === 'available' && updateInfo && (
              <div className="space-y-3">
                <div className="text-sm text-on-surface-variant">
                  <span className="text-primary font-semibold">v{updateInfo.version}</span>
                  {' '}sürümü hazır
                </div>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    className="flex-1 px-3 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium shadow-elev-2 hover:bg-primary-fixed-dim transition-colors"
                  >
                    İndir
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant text-sm hover:bg-surface-bright transition-colors"
                  >
                    Sonra
                  </motion.button>
                </div>
              </div>
            )}
            
            {/* Downloading */}
            {status === 'downloading' && progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-secondary">
                  <span>{formatBytes(progress.transferred)} / {formatBytes(progress.total)}</span>
                  <span>{formatSpeed(progress.bytesPerSecond)}</span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    className="h-full bg-primary rounded-full"
                    style={{
                      boxShadow: '0 0 8px rgba(198, 198, 207, 0.4)'
                    }}
                  />
                </div>
                
                <div className="text-center text-xs text-secondary">
                  %{progress.percent.toFixed(0)} tamamlandı
                </div>
              </div>
            )}
            
            {/* Downloaded */}
            {status === 'downloaded' && (
              <div className="space-y-3">
                <div className="text-sm text-on-surface-variant">
                  Güncelleme indirildi. Yüklemek için uygulamayı yeniden başlatın.
                </div>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className="flex-1 px-3 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium shadow-elev-2 hover:bg-primary-fixed-dim transition-colors"
                  >
                    Şimdi Yeniden Başlat
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant text-sm hover:bg-surface-bright transition-colors"
                  >
                    Sonra
                  </motion.button>
                </div>
              </div>
            )}
            
            {/* Error */}
            {status === 'error' && (
              <div className="space-y-3">
                <div className="text-sm text-error">
                  {error || 'Güncelleme sırasında bir hata oluştu.'}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckForUpdates}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant text-sm hover:bg-surface-bright transition-colors"
                >
                  Tekrar Dene
                </motion.button>
              </div>
            )}
            
            {/* Checking */}
            {status === 'checking' && (
              <div className="flex items-center justify-center py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
