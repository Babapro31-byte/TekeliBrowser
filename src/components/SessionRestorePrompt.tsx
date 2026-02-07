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
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[92vw]
                       bg-dark-surface border border-neon-blue/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-neon-blue/10">
              <h3 className="text-white font-semibold text-lg">Son oturum geri yüklensin mi?</h3>
              <p className="text-white/60 text-sm mt-1">
                {tabCount} sekme bulundu. Tarayıcı önceki sefer düzgün kapanmamış olabilir.
              </p>
            </div>
            <div className="p-5 flex items-center justify-end gap-3">
              <button
                onClick={onDiscard}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                Yeni Sekme ile Başla
              </button>
              <button
                onClick={onRestore}
                className="px-4 py-2 rounded-lg bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue font-medium transition-colors"
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

