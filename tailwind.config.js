/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./frontend/index.html', './frontend/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d8efff',
          200: '#b6e0ff',
          300: '#83cbff',
          400: '#45afff',
          500: '#2091ff',
          600: '#1173f5',
          700: '#0f5bd5',
          800: '#114aaa',
          900: '#123f88',
          950: '#0a2755'
        }
      }
    }
  },
  plugins: []
};
