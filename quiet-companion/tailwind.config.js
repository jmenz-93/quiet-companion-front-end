/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3'
        },
        up: '#12805c',
        down: '#d0342c'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 24, 40, 0.04)',
        lift: '0 8px 24px rgba(16, 24, 40, 0.08)'
      }
    }
  },
  plugins: []
};
