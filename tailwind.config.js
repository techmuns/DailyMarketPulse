/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm Alpha — Emerald + Lavender Mist
        // (slightly deeper / richer pass — see CHANGELOG below)
        ivory: {
          50: '#ECE3F4',  // page background — lavender mist (was #F4F1FA)
          100: '#E4DAEF', // secondary section tint    (was #EEE8F7)
          200: '#D9CDE7',
        },
        cream: '#FFFDF9',        // primary card background — keep near-white for separation
        'cream-deep': '#F6F1E8', // elevated / secondary surface — a touch warmer
        charcoal: {
          DEFAULT: '#1F2933',
          soft: '#3F4754',
          mute: '#667085',
        },
        calm: {
          // Emerald (brand / active / support) — ~10% richer
          emerald: '#0B7E61',
          'emerald-bg': '#DAF1E5',
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
        bordersoft: '#CEC4E1',
        tabinactive: '#F3F0F7',
        hoverwash: '#EDF6F3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Newsreader"', '"Source Serif 4"', 'Georgia', 'serif'],
        masthead: ['"Playfair Display"', '"Newsreader"', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Violet-tinted secondary shadow so cards separate from the
        // lavender page wash without going visually neutral.
        soft: '0 1px 2px rgba(31, 41, 51, 0.05), 0 8px 22px rgba(76, 55, 120, 0.08)',
        lift: '0 2px 4px rgba(31, 41, 51, 0.07), 0 16px 36px rgba(76, 55, 120, 0.11)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
