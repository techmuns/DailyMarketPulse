/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm Alpha — Emerald + Lavender Mist
        ivory: {
          50: '#F4F1FA',  // page background — lavender mist
          100: '#EEE8F7', // secondary section tint
          200: '#E5DDEF',
        },
        cream: '#FFFDF9',        // primary card background
        'cream-deep': '#F8F5EF', // elevated / secondary surface
        charcoal: {
          DEFAULT: '#1F2933',
          soft: '#3F4754',
          mute: '#667085',
        },
        calm: {
          // Emerald (brand / active / support)
          emerald: '#0F8F6F',
          'emerald-bg': '#E6F7F0',
          green: '#36A379',
          'green-bg': '#E8F7EF',
          // Negative
          rose: '#C86B6B',
          'rose-bg': '#F9EAEA',
          // Watch / neutral
          amber: '#D7A14A',
          'amber-bg': '#FFF3DD',
          // Cool slate (portfolio / filings context)
          navy: '#4F5D7A',
          'navy-bg': '#E2E6EF',
          // Lavender (AI insight)
          violet: '#8C79C9',
          'violet-bg': '#F0EBFF',
        },
        bordersoft: '#DDD6E8',
        tabinactive: '#F3F0F7',
        hoverwash: '#EDF6F3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Newsreader"', '"Source Serif 4"', 'Georgia', 'serif'],
        masthead: ['"Playfair Display"', '"Newsreader"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31, 41, 51, 0.04), 0 6px 18px rgba(31, 41, 51, 0.04)',
        lift: '0 2px 4px rgba(31, 41, 51, 0.06), 0 14px 32px rgba(31, 41, 51, 0.07)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
