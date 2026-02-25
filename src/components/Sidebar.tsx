import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, Shield, Bookmark, Clock, Download, ChevronDown, LayoutGrid } from 'lucide-react';
import type { ThemeDef } from '../utils/themes';

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
  activeTheme?: ThemeDef;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-full flex-shrink-0 bg-bg-secondary/95 backdrop-blur-lg border-r border-white/5 flex flex-col overflow-hidden text-gray-300 relative z-20"
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            
            {/* Profile */}
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold shadow-glow">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">User Profile</p>
                <p className="text-xs text-gray-500 truncate">Syncing to cloud</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </div>

            {/* Spaces */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 px-2 tracking-wider flex items-center gap-2">
                <LayoutGrid size={12} /> SPACES
              </h3>
              <div className="flex gap-2 px-2">
                <button className="flex-1 py-1.5 px-3 rounded-lg bg-accent-blue/20 text-accent-blue text-sm border border-accent-blue/30 hover:bg-accent-blue/30 transition-colors flex items-center justify-center gap-2">
                  <Home size={14} /> Personal
                </button>
                <button className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 text-gray-400 text-sm border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <Briefcase size={14} /> Work
                </button>
              </div>
            </div>

            {/* Pinned */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 px-2 tracking-wider">PINNED</h3>
              <div className="space-y-1">
                {['GitHub', 'Gmail', 'Notion'].map(item => (
                  <div key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                      {item[0]}
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              {[
                { icon: Bookmark, label: 'Bookmarks' },
                { icon: Clock, label: 'History' },
                { icon: Download, label: 'Downloads' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                  <item.icon size={18} className="text-gray-400 group-hover:text-accent-blue transition-colors" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Privacy Dashboard */}
            <div className="mt-auto pt-6">
              <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-white/5 border-l-4 border-l-accent-green">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-accent-green" />
                  <h4 className="text-sm font-medium text-white">Privacy Status</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-bg-primary/50 p-2 rounded-lg">
                    <p className="text-lg font-semibold text-white">1.2k</p>
                    <p className="text-[10px] text-gray-500 uppercase">Blocked</p>
                  </div>
                  <div className="bg-bg-primary/50 p-2 rounded-lg">
                    <p className="text-lg font-semibold text-white">45<span className="text-xs">MB</span></p>
                    <p className="text-[10px] text-gray-500 uppercase">Saved</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
