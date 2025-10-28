/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#1a1d29',      // Main background
          secondary: '#242837',    // Card backgrounds
          accent: '#2e3348',       // Hover states
          border: '#363b54',       // Borders
        },
        navy: {
          50: '#e6eef8',
          100: '#c0d7ee',
          200: '#96bde3',
          300: '#6ba3d8',
          400: '#4c8fd0',
          500: '#2e7cc7',
          600: '#2971b8',
          700: '#2262a4',
          800: '#1c5490',
          900: '#0d3a6e',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #1a1d29 0%, #242837 50%, #1a1d29 100%)',
        'gradient-navy': 'linear-gradient(135deg, #2e7cc7 0%, #1c5490 100%)',
      },
    },
  },
  plugins: [],
}
