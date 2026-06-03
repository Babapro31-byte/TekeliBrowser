export type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'yellow' | 'rose' | 'cyan' | 'fuchsia' | 'orange' | 'solaris';
export type PrivacyLevel = 'off' | 'standard' | 'strict';
export type ThemeId = 'dark' | 'light' | 'oled' | 'solaris';

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
  type: 'dark' | 'light';
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
  },
  solaris: {
    name: 'Solaris Amber',
    bg: 'bg-primary-container',
    accent: 'text-primary',
    borderFull: 'border-primary-container',
    borderHalf: 'border-primary-container/50',
    borderLow: 'border-primary-container/30',
    bgLow: 'bg-primary-container/10',
    bgMed: 'bg-primary-container/20',
    bgHigh: 'bg-solaris-surface-container-high',
    hover: 'hover:bg-solaris-surface-container-high hover:text-primary',
    shadowOuter: 'shadow-[0_0_30px_rgba(255,191,0,0.15)]',
    shadowInner: 'shadow-[inset_0_0_10px_rgba(255,191,0,0.2)]',
    shadowGlow: 'shadow-[0_0_15px_rgba(255,191,0,0.3)]',
    lightAccent: 'text-amber-600',
    lightBgLow: 'bg-amber-50',
    lightHover: 'hover:bg-amber-100 hover:text-amber-700'
  }
};

export const getThemes = (): Record<ThemeId, ThemeDef> => ({
  dark: {
    id: 'dark',
    name: 'Dark',
    desc: 'Modern koyu tema',
    window: 'bg-bg-primary text-text-primary',
    panel: 'bg-bg-secondary border-border-subtle',
    hover: 'hover:bg-bg-hover transition-colors',
    active: 'bg-bg-elevated border-accent text-accent',
    accent: 'text-accent',
    border: 'border-accent/20',
    input: 'bg-bg-tertiary border-border-medium focus:border-accent text-text-primary',
    type: 'dark'
  },
  light: {
    id: 'light',
    name: 'Light',
    desc: 'Aydınlık tema',
    window: 'bg-white text-slate-900',
    panel: 'bg-slate-50 border-slate-200',
    hover: 'hover:bg-slate-100 transition-colors',
    active: 'bg-white border-violet-500 text-violet-600',
    accent: 'text-violet-600',
    border: 'border-slate-200',
    input: 'bg-white border-slate-300 focus:border-violet-500 text-slate-900',
    type: 'light'
  },
  oled: {
    id: 'oled',
    name: 'OLED',
    desc: 'Tam siyah (OLED ekranlar için)',
    window: 'bg-black text-white',
    panel: 'bg-[#0A0A0A] border-[#1A1A1A]',
    hover: 'hover:bg-[#141414] transition-colors',
    active: 'bg-[#1A1A1A] border-accent text-accent',
    accent: 'text-accent',
    border: 'border-[#1A1A1A]',
    input: 'bg-[#0A0A0A] border-[#333333] focus:border-accent text-white',
    type: 'dark'
  },
  solaris: {
    id: 'solaris',
    name: 'Solaris',
    desc: 'Celestial Editorial - Amber/Sunset theme',
    window: 'bg-solaris-background text-solaris-on-surface',
    panel: 'bg-solaris-surface-container-low border-solaris-outline/15',
    hover: 'hover:bg-solaris-surface-container-high transition-colors',
    active: 'bg-solaris-surface-container-highest border-solaris-primary-container text-solaris-primary',
    accent: 'text-solaris-primary',
    border: 'border-solaris-outline/15',
    input: 'bg-solaris-surface-container-lowest border-solaris-outline-variant focus:border-solaris-primary text-solaris-on-surface',
    type: 'dark'
  }
});
