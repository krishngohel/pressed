// CSS-variable colors with alpha support: relative color syntax lets
// Tailwind opacity modifiers (e.g. bg-navy-s/40) work on hex variables.
const v = (name) => `rgb(from var(${name}) r g b / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: v('--paper'),
        cream: v('--cream'),
        ink: v('--ink'),
        graphite: v('--graphite'),
        stone: v('--stone'),
        rule: v('--rule'),
        navy: {
          DEFAULT: v('--navy'),
          d: v('--navy-d'),
          p: v('--navy-p'),
          s: v('--navy-s'),
        },
        moss: {
          DEFAULT: v('--moss'),
          s: v('--moss-s'),
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        body: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.32, 0.72, 0.24, 1)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,27,22,0.04), 0 4px 16px rgba(31,27,22,0.05)',
        lift: '0 2px 4px rgba(31,27,22,0.06), 0 12px 32px rgba(31,27,22,0.10)',
        featured: '0 4px 12px rgba(30,58,138,0.12), 0 16px 48px rgba(30,58,138,0.14)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
