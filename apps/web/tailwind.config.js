/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'navy-950': '#1a1a2e',
        'navy-900': '#252540',
        'gold-500': '#D4A248',
        // Legacy Emart colors (for backwards compatibility)
        'emart-pink': '#e8197a',
        'emart-dark': '#1a1a2e',
        'emart-light': '#fce7f0',
        // Lumière K-Beauty design system
        'lumiere': {
          'primary': '#F24E5E',
          'primary-hover': '#E63A49',
          'primary-light': '#FADADC',
          'secondary': '#3D8762',
          'secondary-hover': '#2F6B50',
          'secondary-light': '#E8F5E9',
          'background': '#FAF9F7',
          'background-dark': '#F5F1ED',
          'background-gray': '#F9F8F6',
          'accent': '#D4A017',
          'accent-light': '#F4E4C3',
          'text-primary': '#1a1a2e',
          'text-secondary': '#666666',
          'text-tertiary': '#999999',
          'white': '#FFFFFF',
          'border-light': '#E8E8E8',
          'border-medium': '#D0D0D0',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        bengali: ['var(--font-bengali)'],
        serif: ['"Noto Serif"', 'serif'],
        'sans-jakarta': ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
