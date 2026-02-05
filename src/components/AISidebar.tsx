import { motion, AnimatePresence } from 'framer-motion';

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISidebar = ({ isOpen, onClose }: AISidebarProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 350, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-80 h-full glass border-l border-neon-purple/20 flex flex-col"
        >
          {/* Header */}
          <div className="h-14 border-b border-neon-purple/20 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M9 3L11 7L15 8L12 11L13 15L9 13L5 15L6 11L3 8L7 7L9 3Z" />
                </svg>
              </div>
              <span className="text-white/90 font-semibold">AI Asistan</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1L13 13M13 1L1 13" />
              </svg>
            </motion.button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="url(#gradient)" strokeWidth="2">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="100%" stopColor="#b026ff" />
                    </linearGradient>
                  </defs>
                  <circle cx="20" cy="14" r="8" />
                  <path d="M8 36C8 29.3726 13.3726 24 20 24C26.6274 24 32 29.3726 32 36" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white/90 mb-2">Yakında Geliyor</h3>
              <p className="text-white/60 text-sm mb-6">
                AI destekli web asistanınız. Sohbet edin, sorular sorun ve daha fazlasını yapın.
              </p>
              
              {/* Feature List */}
              <div className="text-left space-y-3">
                {[
                  { icon: '🤖', text: 'Yapay Zeka Sohbet' },
                  { icon: '🔍', text: 'Akıllı Arama' },
                  { icon: '📝', text: 'Sayfa Özeti' },
                  { icon: '🌐', text: 'Çeviri Desteği' }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg glass hover:neon-glow transition-all cursor-pointer"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-white/80 text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="h-16 border-t border-neon-purple/20 flex items-center justify-center px-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full h-10 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold neon-glow"
            >
              Beta'ya Katıl
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AISidebar;
