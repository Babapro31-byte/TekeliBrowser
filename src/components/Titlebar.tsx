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
    <header className="flex items-center justify-between w-full h-12 pl-4 bg-background text-on-surface select-none flex-shrink-0 border-b border-outline/10">
      <div className="flex items-center gap-3">
        <span className="text-sm font-extrabold tracking-[-0.12em] text-primary">TEKELI</span>
      </div>

      <div className="flex items-stretch h-full">
        <button
          onClick={handleMinimize}
          className="h-full w-12 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-highest transition-colors cursor-pointer"
          title="Küçült"
          aria-label="Küçült"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
        </button>
        <button
          onClick={handleMaximize}
          className="h-full w-12 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-highest transition-colors cursor-pointer"
          title="Büyüt"
          aria-label="Büyüt / Geri Yükle"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check_box_outline_blank</span>
        </button>
        <button
          onClick={handleClose}
          className="h-full w-12 flex items-center justify-center text-secondary hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
          title="Kapat"
          aria-label="Kapat"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
        </button>
      </div>
    </header>
  );
};

export default Titlebar;
