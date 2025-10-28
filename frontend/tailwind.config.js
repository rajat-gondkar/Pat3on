/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#000000',      // Pure black background
          secondary: '#0a0a0a',    // Slightly lighter black
          accent: '#1a1a1a',       // Hover states
          border: '#2a2a2a',       // Subtle borders
        },
        navy: {
          50: '#e6eef8',
          100: '#c0d7ee',
          200: '#96bde3',
          300: '#6ba3d8',
          400: '#4c8fd0',
          500: '#4a90e2',
          600: '#3a7bc8',
          700: '#2a5a9e',
          800: '#1c5490',
          900: '#0d3a6e',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        'gradient-navy': 'linear-gradient(135deg, #4a90e2 0%, #2a5a9e 100%)',
      },
    },
  },
  plugins: [],
}
