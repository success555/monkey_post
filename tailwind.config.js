/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Bungee', 'cursive', 'sans-serif'],
      },
      colors: {
        naija: {
          green: '#008751',
          gold: '#fbbf24',
          sand: '#b36b41',
          brick: '#78350f',
        },
      },
    },
  },
  plugins: [],
};

