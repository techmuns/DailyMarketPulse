/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm Alpha v2 — warmer, slightly deeper, easier on the eyes
        ivory: {
          50: '#ECE5D6', // page background — warm taupe
          100: '#E3DAC6',
          200: '#D9CFB6',
        },
        cream: '#F4EEDF',        // primary card surface
        'cream-deep': '#EEE6D2', // secondary surface (header, kanban)
        charcoal: {
          DEFAULT: '#2D2E36',
          soft: '#454751',
          mute: '#7A7A82',
        },
        calm: {
          green: '#6FAE92',
          'green-bg': '#DDE7DC',
          rose: '#BF7E78',
          'rose-bg': '#EEDAD4',
          amber: '#B79257',
          'amber-bg': '#EADDBE',
          navy: '#3F5C7A',
          'navy-bg': '#D6DEE7',
          violet: '#8C82B0',
          'violet-bg': '#DDD8E6',
        },
        bordersoft: '#D6CCB4',
        borderstrong: '#C5B998',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Source Serif Pro"', '"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(60, 50, 30, 0.05), 0 6px 18px rgba(60, 50, 30, 0.04)',
        lift: '0 2px 4px rgba(60, 50, 30, 0.07), 0 14px 32px rgba(60, 50, 30, 0.07)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
