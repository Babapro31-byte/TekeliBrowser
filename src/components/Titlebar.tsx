import { motion } from 'framer-motion';

const Titlebar = () => {
  const handleMinimize = () => {
    if (window.electron) {
      window.electron.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electron) {
      window.electron.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.closeWindow();
    }
  };

  return (
    <div 
      className="h-8 bg-dark-surface/80 backdrop-blur-md flex items-center justify-between px-4 border-b border-neon-blue/10"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        <motion.div
          className="w-5 h-5 rounded bg-gradient-to-br from-neon-blue to-neon-purple"
          animate={{ 
            boxShadow: [
              '0 0 5px rgba(0, 240, 255, 0.5)',
              '0 0 15px rgba(176, 38, 255, 0.5)',
              '0 0 5px rgba(0, 240, 255, 0.5)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-sm font-semibold text-white/90">TekeliBrowser</span>
      </div>
      
      {/* Window Controls */}
      <div 
        className="flex items-center space-x-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 240, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMinimize}
          className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
            <rect width="12" height="2" />
          </svg>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 240, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMaximize}
          className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="10" height="10" />
          </svg>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 50, 50, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-red-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1L11 11M11 1L1 11" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default Titlebar;
