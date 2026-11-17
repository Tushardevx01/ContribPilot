/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#06080d',
        surface: {
          DEFAULT: '#0b0f19',
          card: '#101726',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.04)',
        },
        brand: {
          cyan: '#38bdf8',
          indigo: '#6366f1',
          purple: '#8b5cf6',
          pink: '#ec4899',
          orange: '#f97316',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      backgroundImage: {
        'gemini-gradient': 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #ec4899 100%)',
        'horizon-glow': 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(99, 102, 241, 0.25), transparent)',
        'matrix-radial': 'radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.18), rgba(99, 102, 241, 0.15) 35%, rgba(56, 189, 248, 0.12) 60%, transparent 80%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'terminal-cursor': 'blink 1s step-end infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
