/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Colors
        'bg-primary': '#050508',
        'bg-secondary': '#0a0a0f',
        'bg-tertiary': '#141423',
        'bg-elevated': '#1a1a2e',
        
        // Accent Colors
        'accent-blue': '#00f0ff',
        'accent-purple': '#b026ff',
        'accent-pink': '#ff2d92',
        'accent-green': '#00ff88',
        'accent-orange': '#ff6b35',

        // Legacy colors mapped to new names just in case
        'neon-blue': '#00f0ff',
        'neon-purple': '#b026ff',
        'dark-bg': '#0a0a0f',
        'dark-surface': '#1a1a2e',
        'dark-hover': '#25254d',
      },
      backdropBlur: {
        xs: '2px',
        sm: '10px',
        md: '20px',
        lg: '40px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,240,255,0.3), 0 0 10px rgba(0,240,255,0.3)' },
          '100%': { boxShadow: '0 0 10px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.3), 0 0 30px rgba(176,38,255,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring-bounce': 'cubic-bezier(0.68, -0.55, 0.26, 1.55)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
        'glass-active': '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,240,255,0.1)',
        'glass-glow': '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.3)',
        'inner-glass': 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }
    },
  },
  plugins: [],
}
