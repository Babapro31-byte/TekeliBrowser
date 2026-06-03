import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, History, Download, Settings, Menu } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
  onOpenSettings?: () => void;
  onOpenDownloads?: () => void;
  onOpenHistory?: () => void;
  onOpenBookmarks?: () => void;
}

const Sidebar = ({ 
  isOpen, 
  onToggle,
  onOpenSettings,
  onOpenDownloads,
  onOpenHistory,
  onOpenBookmarks,
}: SidebarProps) => {
  const navItems = [
    { icon: Bookmark, label: 'Bookmarks', onClick: onOpenBookmarks },
    { icon: History, label: 'History', onClick: onOpenHistory },
    { icon: Download, label: 'Downloads', onClick: onOpenDownloads },
    { icon: Settings, label: 'Settings', onClick: onOpenSettings },
  ];

  return (
    <AnimatePresence>
      {!isOpen ? (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          onClick={onToggle}
          aria-label="Kenar çubuğunu aç"
          aria-expanded={false}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-overlay w-7 h-20 flex items-center justify-center rounded-l-md bg-surface-container-low border border-r-0 border-outline/15 hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          <Menu size={14} className="text-secondary" aria-hidden="true" />
        </motion.button>
      ) : (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-full flex-shrink-0 flex flex-col overflow-hidden relative z-20 border-l border-outline/10 bg-surface-container-low"
          style={{
            minWidth: 0,
          }}
          role="complementary"
          aria-label="Kenar çubuğu"
        >
          <div className="mb-8 flex flex-col items-center px-4 pt-6">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-surface-container-highest">
              <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">grid_view</span>
            </div>
            <div className="mt-4 text-center">
              <h2 className="font-headline font-bold text-primary tracking-tight">Workspace</h2>
              <p className="text-[10px] text-secondary uppercase tracking-[0.24em] font-label">Tekeli Workspace</p>
            </div>
          </div>

          <nav aria-label="Çalışma alanı" className="flex flex-col gap-2 px-4 flex-1 font-body text-sm font-medium">
            <button
              onClick={onOpenBookmarks}
              className="flex items-center gap-3 px-3 py-3 text-primary bg-surface-container-highest rounded-md cursor-pointer group transition-all duration-200 ease-in-out"
            >
              <Bookmark size={18} aria-hidden="true" />
              <span>Bookmarks</span>
            </button>

            {navItems.slice(1).map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex items-center gap-3 px-3 py-3 text-secondary hover:text-primary hover:bg-surface-container-high rounded-md cursor-pointer group transition-all duration-200 ease-in-out"
              >
                <item.icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 px-4 pb-4">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-3 px-3 py-3 text-secondary hover:text-primary hover:bg-surface-container-high rounded-md cursor-pointer group transition-all duration-200 ease-in-out w-full"
            >
              <Settings size={18} aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>

          <button
            onClick={onToggle}
            aria-label="Kenar çubuğunu kapat"
            className="mx-4 mb-4 py-3 text-primary font-medium rounded-md bg-surface-container-highest transition-colors hover:bg-surface-bright"
          >
            Kapat
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
