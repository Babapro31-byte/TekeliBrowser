export const colors = {
  dark: {
    bg: {
      primary: '#0D0D0D',
      secondary: '#171717',
      tertiary: '#1F1F1F',
      elevated: '#242424',
      hover: '#2A2A2A',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1A1',
      muted: '#525252',
    },
    border: {
      subtle: '#262626',
      medium: '#404040',
    },
    accent: {
      primary: '#8B5CF6',
      hover: '#7C3AED',
      active: '#6D28D9',
    },
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
  },
  light: {
    bg: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      tertiary: '#F0F0F0',
      elevated: '#FFFFFF',
      hover: '#EBEBEB',
    },
    text: {
      primary: '#171717',
      secondary: '#525252',
      muted: '#A1A1A1',
    },
    border: {
      subtle: '#E5E5E5',
      medium: '#D4D4D4',
    },
    accent: {
      primary: '#7C3AED',
      hover: '#6D28D9',
      active: '#5B21B6',
    },
    success: '#16A34A',
    warning: '#CA8A04',
    error: '#DC2626',
  },
  oled: {
    bg: {
      primary: '#000000',
      secondary: '#0A0A0A',
      tertiary: '#141414',
      elevated: '#1A1A1A',
      hover: '#1F1F1F',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1A1',
      muted: '#525252',
    },
    border: {
      subtle: '#1A1A1A',
      medium: '#333333',
    },
    accent: {
      primary: '#8B5CF6',
      hover: '#7C3AED',
      active: '#6D28D9',
    },
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

export const effects = {
  blur: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.4)',
    lg: '0 10px 15px rgba(0,0,0,0.5)',
    xl: '0 20px 25px rgba(0,0,0,0.6)',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  transition: {
    fast: '100ms',
    normal: '150ms',
    slow: '300ms',
  },
  motion: {
    spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type ThemeMode = 'dark' | 'light' | 'oled';
export type ColorScheme = typeof colors.dark | typeof colors.light | typeof colors.oled;

export const getColorScheme = (mode: ThemeMode): ColorScheme => {
  if (mode === 'light') return colors.light;
  if (mode === 'oled') return colors.oled;
  return colors.dark;
};
