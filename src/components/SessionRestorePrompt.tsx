import { AnimatePresence, motion } from 'framer-motion';

interface SessionRestorePromptProps {
  isOpen: boolean;
  tabCount: number;
  onRestore: () => void;
  onDiscard: () => void;
}

const SessionRestorePrompt = ({ isOpen, tabCount, onRestore, onDiscard }: SessionRestorePromptProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-modal backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-restore-title"
            className="fixed z-modal left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[92vw]
                       bg-surface-container-high border border-outline/15 rounded-2xl shadow-elev-3 overflow-hidden"
          >
            <div className="p-5 border-b border-outline/10">
              <h3 id="session-restore-title" className="text-on-surface font-semibold text-lg">Son oturum geri yüklensin mi?</h3>
              <p className="text-secondary text-sm mt-1">
                {tabCount} sekme bulundu. Tarayıcı önceki sefer düzgün kapanmamış olabilir.
              </p>
            </div>
            <div className="p-5 flex items-center justify-end gap-3">
              <button
                onClick={onDiscard}
                className="px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Yeni Sekme ile Başla
              </button>
              <button
                onClick={onRestore}
                className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors"
              >
                Geri Yükle
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SessionRestorePrompt;

