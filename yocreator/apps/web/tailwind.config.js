/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a2e',
        'dark-panel': '#16162a',
        'dark-border': '#2a2a4a',
        'dark-hover': '#3a3a5a',
      },
    },
  },
  plugins: [],
}
