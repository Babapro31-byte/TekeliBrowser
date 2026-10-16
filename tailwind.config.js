/** Colors resolve to the CSS variables in src/styles/tokens.css (design-system/TOKENS.md). */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./chrome.html', './pages.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: c('app'),
        chrome: c('chrome'),
        toolbar: c('toolbar'),
        surface: c('surface'),
        raised: c('raised'),
        hover: c('hover'),
        pressed: c('pressed'),
        field: c('field'),
        fg: { DEFAULT: c('fg'), 2: c('fg-2'), 3: c('fg-3'), accent: c('on-accent'), link: c('link') },
        line: { DEFAULT: c('line'), subtle: c('line-subtle'), strong: c('line-strong') },
        accent: { DEFAULT: c('accent'), hover: c('accent-hover'), subtle: c('accent-subtle') },
        ok: { DEFAULT: c('ok'), subtle: c('ok-subtle') },
        warn: { DEFAULT: c('warn'), subtle: c('warn-subtle') },
        danger: { DEFAULT: c('danger'), subtle: c('danger-subtle') },
        ring: c('ring'),
      },
      borderRadius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
      fontSize: {
        caption: ['11px', '16px'],
        small: ['12px', '16px'],
        body: ['13px', '20px'],
        title: ['16px', '24px'],
        heading: ['22px', '28px'],
        display: ['32px', '40px'],
      },
      boxShadow: {
        tab: '0 1px 2px rgba(0,0,0,.25)',
        popover: '0 8px 24px rgba(0,0,0,.35)',
        dialog: '0 16px 48px rgba(0,0,0,.45)',
      },
      transitionDuration: { fast: '120ms', DEFAULT: '200ms', slow: '300ms' },
    },
  },
  plugins: [],
};
