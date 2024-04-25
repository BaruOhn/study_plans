/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')
const { screens } = require('tailwindcss/defaultTheme')

module.exports = {
  content: ["./client/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'bg-gray-light': '#F0F0F0',
        'bg-gray-dark': '#CFCFD0',
      },
      fontFamily: {
        'sans': ['IBM\\ Plex\\ Sans', 'sans-serif', ...require('tailwindcss/defaultTheme').fontFamily.sans],
      },
      // Přidání vlastní animace
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'pop-in': 'popIn 0.2s ease-out forwards',
      },
      // Definice klíčových snímků pro animaci 'fade-in'
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        popIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
      screens: {
        'xs': '475px',
        ...screens,
      },
    },
  },
  plugins: [],
}

