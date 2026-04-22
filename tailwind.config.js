/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'soft-green': {
          50: '#f2fdf7', 
          100: '#e1f9ee', 
          200: '#c5f2dd', 
          300: '#92c5b2', 
          400: '#75bfa9', 
          500: '#52a890', 
          600: '#3e8f7a', 
          700: '#388e3c', 
          800: '#2e7d32', 
          900: '#2d6a5a', 
          950: '#1b4137'
        },
        'lime-green': {
          DEFAULT: '#dce775',
          50: '#f9fbe7',
          100: '#f0f4c3',
          200: '#e6ee9c',
          300: '#dce775',
          400: '#d4e157',
          500: '#cddc39',
          600: '#c0ca33',
          700: '#afb42b',
          800: '#9e9d24',
          900: '#827717',
        }
      }
    },
  },
  plugins: [],
}
