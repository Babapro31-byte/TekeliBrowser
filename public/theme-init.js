// Runs before first paint (blocking, same-origin) so the chosen theme never flashes.
(function () {
  try {
    var b = window.tekeli && window.tekeli.boot;
    if (!b) return;
    var root = document.documentElement;
    root.dataset.theme = b.theme;
    root.dataset.accent = b.settings.accent;
    root.lang = b.lang;
    if (b.settings.reduceMotion) root.dataset.motion = 'reduced';
  } catch (e) { /* theme falls back to CSS defaults */ }
})();
