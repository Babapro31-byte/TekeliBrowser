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
          role="dialog"
          aria-live="polite"
          className="absolute left-1/2 -translate-x-1/2 top-14 z-prompt flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-high/95 backdrop-blur-md border border-outline/15 shadow-elev-3"
        >
          <span className="text-sm text-on-surface">
            <strong className="text-primary">{pending.site}</strong> {label} kullanmak istiyor
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded-sm border-outline/40 bg-surface-container-lowest accent-primary"
              />
              Bu site için hatırla
            </label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAllow}
              className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors"
            >
              İzin Ver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBlock}
              className="px-3 py-1.5 rounded-lg bg-error/20 hover:bg-error/30 text-error text-sm font-medium transition-colors"
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
