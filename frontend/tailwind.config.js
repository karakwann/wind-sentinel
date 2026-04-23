export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette claire "Ciel Dégagé"
        bg: {
          deep:    '#EDF4FF',   // fond principal (ciel pâle)
          base:    '#FFFFFF',   // cards
          elevated:'#F8FAFC',  // cards surélevées
          muted:   '#F1F5F9',   // éléments secondaires
        },
        border: {
          DEFAULT: '#CBD5E1',
          subtle:  '#E2E8F0',
          bright:  '#94A3B8',
        },
        text: {
          primary:  '#0F172A',
          secondary:'#475569',
          muted:    '#94A3B8',
        },
        accent: {
          blue:    '#0284C7',
          indigo:  '#5E6AD2',
          emerald: '#22C55E',
          amber:   '#D97706',
        },
        wind: {
          calm:    '#93C5FD',
          breeze:  '#22C55E',
          moderate:'#EAB308',
          strong:  '#F97316',
          gale:    '#C2410C',
          storm:   '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 2s linear infinite',
      },
      boxShadow: {
        'panel': '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
        'glow-blue': '0 0 10px rgba(2,132,199,0.18)',
      },
    },
  },
  plugins: [],
}

