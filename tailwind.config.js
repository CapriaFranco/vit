/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ultra-dark': '#0a0a0a',
        'dark-gray': '#111111',
        'medium-gray': '#1a1a1a',
        'light-gray': '#2a2a2a',
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'accent': '#3b82f6',
        'accent-hover': '#2563eb',
      },
      fontFamily: {
        'sans': ['Lexend', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}