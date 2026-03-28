/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EA580C',
        accent: '#0D9488',
        ink: '#1C1917',
        muted: '#78716C',
        bg: '#FFF7ED',
        surface: '#FFFFFF',
        'board-line': '#292524',
        'board-faint': '#F5F5F4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        rubik: ['Rubik', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
