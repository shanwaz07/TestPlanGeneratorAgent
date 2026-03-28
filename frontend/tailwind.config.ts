import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Leoforce Design Language 2.0
        'cosmic-indigo':       '#2D2E67',
        'cosmic-indigo-light': '#EAEBF6',
        'stellar-blue':        '#3E83FA',
        'stellar-blue-light':  '#EBF2FE',
        'nebula-green':        '#48E29A',
        'solar-flare':         '#C8FF73',
        'quantum-purple':      '#7717C7',
        'galactic-violet':     '#B030FF',
        'dark-matter':         '#373A40',
        'lunar-mist':          '#F6F9FD',
        'alert-red':           '#D63031',
        'alert-red-light':     '#FDEDED',
      },
      fontFamily: {
        sans: ['"Tenorite"', '"Aptos"', '"Calibri"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Tenorite Mono"', '"Cascadia Code"', '"Consolas"', 'monospace'],
      },
      spacing: {
        // 8px grid
        '18': '72px',
        '22': '88px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(45,46,103,0.08), 0 1px 2px -1px rgba(45,46,103,0.05)',
        'card-hover': '0 4px 12px 0 rgba(45,46,103,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
