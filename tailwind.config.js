/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./frontend/pages/**/*.{js,jsx}', './frontend/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { primary: 'var(--tenant-primary)', 'primary-dark': 'var(--tenant-primary-dark)' },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
