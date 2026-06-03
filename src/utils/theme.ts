export type ThemeId = 'dark' | 'light' | 'oled';
export type AccentId = 'neutral' | 'amber' | 'indigo' | 'emerald' | 'rose';

export function applyTheme(theme: ThemeId, accent: AccentId): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }
  if (accent === 'neutral') {
    delete root.dataset.accent;
  } else {
    root.dataset.accent = accent;
  }
  localStorage.setItem('tekeli:theme', theme);
  localStorage.setItem('tekeli:accent', accent);
}

export function loadStoredTheme(): void {
  const theme = (localStorage.getItem('tekeli:theme') || 'dark') as ThemeId;
  const accent = (localStorage.getItem('tekeli:accent') || 'neutral') as AccentId;
  applyTheme(theme, accent);

  if (localStorage.getItem('tekeli:reducedMotion') === 'true') {
    document.documentElement.dataset.reducedMotion = 'true';
  }
}
