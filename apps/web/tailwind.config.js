/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'emart-pink': '#e8197a',
        'emart-dark': '#1a1a2e',
        'emart-light': '#fce7f0',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        bengali: ['var(--font-bengali)'],
      },
    },
  },
  plugins: [],
};
