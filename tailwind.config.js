/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#432E54',
          light: '#5a3e70',
          dark: '#2c1e38',
        },
        secondary: {
          DEFAULT: '#4B4376',
          light: '#635c99',
          dark: '#332e52',
        },
        accent: {
          DEFAULT: '#AE445A',
          light: '#c75e73',
          dark: '#8c3648',
        },
        neutral: {
          DEFAULT: '#E8BCB9',
          light: '#f2d6d4',
          dark: '#d9a19e',
        },
      },
    },
  },
  plugins: [],
};