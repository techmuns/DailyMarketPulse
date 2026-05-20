/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm Alpha — Emerald + Lavender Mist
        // Page canvas leans near-white now; lavender is used as a
        // selective accent (Pulse Brief, lens section, section bands,
        // hover states), not the base.
        ivory: {
          50: '#FAF8FF',  // page background — near-white with hint of lavender
          100: '#F2EDFB', // soft section band tint
          200: '#E8DFF1', // table header / elevated tint
        },
        cream: '#FFFFFF',        // primary card background — clean modern white
        'cream-deep': '#FCFBFF', // elevated / secondary surface — cool pearl
        charcoal: {
          DEFAULT: '#1F2933',
          soft: '#3F4754',
          mute: '#667085',
        },
        calm: {
          // Emerald (brand / active / support)
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
        // Soft modern depth — violet-tinted drop instead of neutral
        // grey so cards lift off the lavender canvas with a clean
        // glow rather than a dated grey halo.
        soft: '0 1px 2px rgba(31, 41, 51, 0.04), 0 14px 34px rgba(72, 55, 120, 0.08)',
        lift: '0 2px 6px rgba(31, 41, 51, 0.05), 0 22px 48px rgba(72, 55, 120, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
