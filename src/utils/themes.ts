
export type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'yellow' | 'rose' | 'cyan' | 'fuchsia' | 'orange';
export type PrivacyLevel = 'off' | 'standard' | 'strict';
export type ThemeId = 'neon' | 'zen' | 'cyberpunk' | 'terminal' | 'light';

export type ColorClass = {
  name: string;
  bg: string;
  accent: string;
  borderFull: string;
  borderHalf: string;
  borderLow: string;
  bgLow: string;
  bgMed: string;
  bgHigh: string;
  hover: string;
  shadowOuter: string;
  shadowInner: string;
  shadowGlow: string;
  lightAccent: string;
  lightBgLow: string;
  lightHover: string;
};

export type ThemeDef = {
  id: ThemeId;
  name: string;
  desc: string;
  window: string;
  panel: string;
  hover: string;
  active: string;
  accent: string;
  border: string;
  input: string;
};

export const colorClasses: Record<ThemeColor, ColorClass> = {
  indigo: {
    name: 'Orijinal Mor',
    bg: 'bg-indigo-500',
    accent: 'text-indigo-400',
    borderFull: 'border-indigo-500',
    borderHalf: 'border-indigo-500/50',
    borderLow: 'border-indigo-500/30',
    bgLow: 'bg-indigo-500/10',
    bgMed: 'bg-indigo-500/20',
    bgHigh: 'bg-indigo-900/20',
    hover: 'hover:bg-indigo-500/20 hover:text-indigo-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    lightAccent: 'text-indigo-600',
    lightBgLow: 'bg-indigo-50',
    lightHover: 'hover:bg-indigo-100 hover:text-indigo-700'
  },
  blue: {
    name: 'Okyanus Mavisi',
    bg: 'bg-blue-500',
    accent: 'text-blue-400',
    borderFull: 'border-blue-500',
    borderHalf: 'border-blue-500/50',
    borderLow: 'border-blue-500/30',
    bgLow: 'bg-blue-500/10',
    bgMed: 'bg-blue-500/20',
    bgHigh: 'bg-blue-900/20',
    hover: 'hover:bg-blue-500/20 hover:text-blue-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    lightAccent: 'text-blue-600',
    lightBgLow: 'bg-blue-50',
    lightHover: 'hover:bg-blue-100 hover:text-blue-700'
  },
  emerald: {
    name: 'Zümrüt Yeşili',
    bg: 'bg-emerald-500',
    accent: 'text-emerald-400',
    borderFull: 'border-emerald-500',
    borderHalf: 'border-emerald-500/50',
    borderLow: 'border-emerald-500/30',
    bgLow: 'bg-emerald-500/10',
    bgMed: 'bg-emerald-500/20',
    bgHigh: 'bg-emerald-900/20',
    hover: 'hover:bg-emerald-500/20 hover:text-emerald-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    lightAccent: 'text-emerald-600',
    lightBgLow: 'bg-emerald-50',
    lightHover: 'hover:bg-emerald-100 hover:text-emerald-700'
  },
  yellow: {
    name: 'Siber Sarı',
    bg: 'bg-yellow-500',
    accent: 'text-yellow-400',
    borderFull: 'border-yellow-500',
    borderHalf: 'border-yellow-500/50',
    borderLow: 'border-yellow-500/30',
    bgLow: 'bg-yellow-500/10',
    bgMed: 'bg-yellow-500/20',
    bgHigh: 'bg-yellow-900/20',
    hover: 'hover:bg-yellow-500/20 hover:text-yellow-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    lightAccent: 'text-yellow-600',
    lightBgLow: 'bg-yellow-50',
    lightHover: 'hover:bg-yellow-100 hover:text-yellow-700'
  },
  rose: {
    name: 'Kan Kırmızı',
    bg: 'bg-rose-500',
    accent: 'text-rose-400',
    borderFull: 'border-rose-500',
    borderHalf: 'border-rose-500/50',
    borderLow: 'border-rose-500/30',
    bgLow: 'bg-rose-500/10',
    bgMed: 'bg-rose-500/20',
    bgHigh: 'bg-rose-900/20',
    hover: 'hover:bg-rose-500/20 hover:text-rose-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(244,63,94,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    lightAccent: 'text-rose-600',
    lightBgLow: 'bg-rose-50',
    lightHover: 'hover:bg-rose-100 hover:text-rose-700'
  },
  cyan: {
    name: 'Camgöbeği',
    bg: 'bg-cyan-500',
    accent: 'text-cyan-400',
    borderFull: 'border-cyan-500',
    borderHalf: 'border-cyan-500/50',
    borderLow: 'border-cyan-500/30',
    bgLow: 'bg-cyan-500/10',
    bgMed: 'bg-cyan-500/20',
    bgHigh: 'bg-cyan-900/20',
    hover: 'hover:bg-cyan-500/20 hover:text-cyan-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    lightAccent: 'text-cyan-600',
    lightBgLow: 'bg-cyan-50',
    lightHover: 'hover:bg-cyan-100 hover:text-cyan-700'
  },
  fuchsia: {
    name: 'Neon Pembe',
    bg: 'bg-fuchsia-500',
    accent: 'text-fuchsia-400',
    borderFull: 'border-fuchsia-500',
    borderHalf: 'border-fuchsia-500/50',
    borderLow: 'border-fuchsia-500/30',
    bgLow: 'bg-fuchsia-500/10',
    bgMed: 'bg-fuchsia-500/20',
    bgHigh: 'bg-fuchsia-900/20',
    hover: 'hover:bg-fuchsia-500/20 hover:text-fuchsia-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(217,70,239,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(217,70,239,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(217,70,239,0.3)]',
    lightAccent: 'text-fuchsia-600',
    lightBgLow: 'bg-fuchsia-50',
    lightHover: 'hover:bg-fuchsia-100 hover:text-fuchsia-700'
  },
  orange: {
    name: 'Alev Turuncusu',
    bg: 'bg-orange-500',
    accent: 'text-orange-400',
    borderFull: 'border-orange-500',
    borderHalf: 'border-orange-500/50',
    borderLow: 'border-orange-500/30',
    bgLow: 'bg-orange-500/10',
    bgMed: 'bg-orange-500/20',
    bgHigh: 'bg-orange-900/20',
    hover: 'hover:bg-orange-500/20 hover:text-orange-300',
    shadowOuter: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(249,115,22,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    lightAccent: 'text-orange-600',
    lightBgLow: 'bg-orange-50',
    lightHover: 'hover:bg-orange-100 hover:text-orange-700'
  }
};

export const getThemes = (activeColor: ColorClass): Record<ThemeId, ThemeDef> => ({
  neon: {
    id: 'neon',
    name: 'Neon Glass',
    desc: 'Canlı renkler, bulanık arka plan.',
    window: `bg-slate-900/90 backdrop-blur-xl ${activeColor.borderLow} ${activeColor.shadowOuter} text-white`,
    panel: `bg-slate-800/80 backdrop-blur-md ${activeColor.borderLow}`,
    hover: `${activeColor.hover} transition-all duration-300`,
    active: `${activeColor.accent} ${activeColor.borderFull} ${activeColor.shadowInner} ${activeColor.bgLow}`,
    accent: activeColor.accent,
    border: activeColor.borderLow,
    input: `bg-slate-900/80 ${activeColor.borderLow} focus-within:${activeColor.borderFull} focus-within:${activeColor.shadowGlow} text-white`
  },
  zen: {
    id: 'zen',
    name: 'Zen / Libre',
    desc: 'Sıfır efekt, mat renkler, tam odak.',
    window: 'bg-zinc-950 border-zinc-800 shadow-2xl text-zinc-100',
    panel: 'bg-zinc-900 border-zinc-800',
    hover: 'hover:bg-zinc-800 transition-none',
    active: 'text-zinc-50 border-zinc-500 bg-zinc-800',
    accent: 'text-zinc-300',
    border: 'border-zinc-800',
    input: 'bg-zinc-950 border-zinc-700 focus-within:border-zinc-500 text-white'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    desc: 'Yüksek kontrast, renkli neon kenarlıklar.',
    window: `bg-yellow-950/90 backdrop-blur-md ${activeColor.borderHalf} shadow-[0_0_20px_rgba(0,0,0,0.5)] text-yellow-50`,
    panel: `bg-black/80 ${activeColor.borderLow}`,
    hover: `${activeColor.hover} transition-all`,
    active: `${activeColor.accent} ${activeColor.borderFull} ${activeColor.shadowGlow} ${activeColor.bgMed}`,
    accent: activeColor.accent,
    border: activeColor.borderHalf,
    input: `bg-black/80 ${activeColor.borderHalf} focus-within:${activeColor.borderFull} focus-within:${activeColor.shadowGlow} text-yellow-100`
  },
  terminal: {
    id: 'terminal',
    name: 'Hacker Terminal',
    desc: 'Siyah zemin, monospaced font.',
    window: `bg-black ${activeColor.borderHalf} shadow-none ${activeColor.accent} font-mono text-green-400`,
    panel: `bg-black ${activeColor.borderHalf}`,
    hover: `${activeColor.hover} transition-none`,
    active: `${activeColor.accent} ${activeColor.borderFull} ${activeColor.bgHigh}`,
    accent: activeColor.accent,
    border: activeColor.borderHalf,
    input: `bg-black ${activeColor.borderHalf} focus-within:${activeColor.borderFull} text-green-400`
  },
  light: {
    id: 'light',
    name: 'Aydınlık Mod',
    desc: 'Gündüz kullanımı için ferah tasarım.',
    window: 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl text-slate-900',
    panel: 'bg-slate-50/90 backdrop-blur-md border-slate-200',
    hover: `${activeColor.lightHover} transition-all`,
    active: `${activeColor.lightAccent} ${activeColor.borderFull} ${activeColor.lightBgLow}`,
    accent: activeColor.lightAccent,
    border: 'border-slate-200',
    input: `bg-white border-slate-300 focus-within:${activeColor.borderFull} focus-within:${activeColor.shadowGlow} text-slate-900`
  }
});
