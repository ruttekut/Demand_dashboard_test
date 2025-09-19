/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9edff',
          200: '#a6d4ff',
          300: '#74bbff',
          400: '#429fff',
          500: '#1a80f2',
          600: '#1066d0',
          700: '#0a4ea3',
          800: '#063474',
          900: '#031d47'
        }
      }
    }
  },
  plugins: []
};
