import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PERMISSION_LABELS: Record<string, string> = {
  media: 'kamera ve mikrofon',
  microphone: 'mikrofon',
  camera: 'kamera',
  geolocation: 'konum',
  notifications: 'bildirimler'
};

interface PermissionRequest {
  requestId: string;
  site: string;
  permission: string;
  requestingUrl?: string;
}

const PermissionPrompt = () => {
  const [pending, setPending] = useState<PermissionRequest | null>(null);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (!window.electron?.onPermissionRequest) return;
    const handler = (data: PermissionRequest) => {
      setPending(data);
      setRemember(false);
    };
    const cleanup = window.electron.onPermissionRequest(handler);
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  const handleAllow = () => {
    if (!pending) return;
    const data = {
      requestId: pending.requestId,
      allow: true,
      remember,
      site: pending.site,
      permission: pending.permission
    };
    window.electron?.permissionResponse?.(data);
    setPending(null);
  };

  const handleBlock = () => {
    if (!pending) return;
    const data = {
      requestId: pending.requestId,
      allow: false,
      remember,
      site: pending.site,
      permission: pending.permission
    };
    window.electron?.permissionResponse?.(data);
    setPending(null);
  };

  const label = pending ? (PERMISSION_LABELS[pending.permission] || pending.permission) : '';

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 -translate-x-1/2 top-14 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-surface/95 backdrop-blur-md border border-neon-blue/20 shadow-xl"
        >
          <span className="text-sm text-white/90">
            <strong className="text-neon-blue">{pending.site}</strong> {label} kullanmak istiyor
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-white/30 bg-dark-bg text-neon-blue focus:ring-neon-blue/50"
              />
              Bu site için hatırla
            </label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAllow}
              className="px-3 py-1.5 rounded-lg bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue text-sm font-medium transition-colors"
            >
              İzin Ver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBlock}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
            >
              Engelle
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PermissionPrompt;
