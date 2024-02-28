/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ["./client/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'nav-blue': '#016BAB',
        'nav-active': '#07467B',
        'custom-gray': '#4B4B4B',
      },
      fontFamily: {
        'sans': ['IBM\\ Plex\\ Sans', 'sans-serif', ...defaultTheme.fontFamily.sans],
      },
    }
  },
  plugins: [],
}

