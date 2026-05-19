/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FBF8F2',
          100: '#F7F3EA',
          200: '#EFEAE0',
        },
        cream: '#FDFCF7',
        charcoal: {
          DEFAULT: '#2B2F36',
          soft: '#3F4550',
          mute: '#6B7280',
        },
        calm: {
          green: '#5BAE8A',
          'green-bg': '#E8F3EC',
          rose: '#C97A78',
          'rose-bg': '#F8E9E7',
          amber: '#D4A24C',
          'amber-bg': '#F8EFD9',
          navy: '#3A5A7A',
          'navy-bg': '#E6EEF5',
          violet: '#8B7BB8',
          'violet-bg': '#EFEAF7',
        },
        bordersoft: '#ECE7DA',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Source Serif Pro"', '"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43, 47, 54, 0.04), 0 4px 16px rgba(43, 47, 54, 0.04)',
        lift: '0 2px 4px rgba(43, 47, 54, 0.06), 0 12px 28px rgba(43, 47, 54, 0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
