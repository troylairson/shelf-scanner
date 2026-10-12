/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        paper: '#f5f5f0',
        punch: '#5B9CF6', // bold sky blue — the pop color
      },
      boxShadow: {
        hard: '4px 4px 0px #0a0a0a',
        'hard-sm': '2px 2px 0px #0a0a0a',
        'hard-lg': '6px 6px 0px #0a0a0a',
        'hard-white': '4px 4px 0px rgba(255,255,255,0.15)',
        'hard-sm-white': '2px 2px 0px rgba(255,255,255,0.15)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
