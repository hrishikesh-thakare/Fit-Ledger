const konstaConfig = require('konsta/config')

/** @type {import('tailwindcss').Config} */
module.exports = konstaConfig({
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#007aff',
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
})
