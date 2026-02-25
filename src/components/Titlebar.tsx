import { motion } from 'framer-motion';
import type { ThemeDef } from '../utils/themes';

interface TitlebarProps {
  activeTheme?: ThemeDef;
}

const Titlebar = ({ activeTheme }: TitlebarProps) => {
  const isLight = activeTheme?.id === 'light';
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
      className={`h-8 backdrop-blur-md flex items-center justify-between pl-4 pr-1 border-b ${
        activeTheme 
          ? `${activeTheme.panel}` 
          : 'bg-dark-surface/80 border-neon-blue/10'
      }`}
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        <motion.div
          className={`w-5 h-5 rounded ${
            activeTheme 
              ? (isLight ? 'bg-gradient-to-br from-slate-600 to-slate-800' : 'bg-gradient-to-br from-neon-blue to-neon-purple') 
              : 'bg-gradient-to-br from-neon-blue to-neon-purple'
          }`}
          animate={isLight ? {} : { 
            boxShadow: [
              '0 0 5px rgba(0, 240, 255, 0.5)',
              '0 0 15px rgba(176, 38, 255, 0.5)',
              '0 0 5px rgba(0, 240, 255, 0.5)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>TekeliBrowser</span>
      </div>
      
      {/* Window Controls */}
      <div 
        className="flex items-center space-x-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 240, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMinimize}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/70 hover:text-white'}`}
        >
          <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
            <rect width="12" height="2" />
          </svg>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 240, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMaximize}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/70 hover:text-white'}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="10" height="10" />
          </svg>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 50, 50, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${isLight ? 'text-slate-500 hover:text-red-500' : 'text-white/70 hover:text-red-400'}`}
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
