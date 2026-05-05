/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FAFAF8',
          alt: '#F3F1EC',
          stone: '#EDEAE3',
        },
        ink: {
          DEFAULT: '#111111',
          2: '#2A2A2A',
        },
        muted: {
          DEFAULT: '#6B6B6B',
          2: '#9A9A9A',
        },
        accent: {
          DEFAULT: '#e8197a',
          soft: '#FCE7F0',
          deep: '#c01264',
        },
        primary: {
          50: '#FFF1F7',
          100: '#FCE7F0',
          500: '#e8197a',
          600: '#e8197a',
          700: '#c01264',
        },
        brass: {
          DEFAULT: '#d4a248',
          soft: '#F5ECD4',
        },
        success: {
          DEFAULT: '#2E7D5B',
          soft: '#E4F0EA',
        },
        warning: {
          DEFAULT: '#C88A2E',
          soft: '#F8ECD6',
        },
        danger: {
          DEFAULT: '#B23B3B',
          soft: '#F5E1E1',
        },
        hairline: 'rgba(17,17,17,0.10)',
        // Compatibility aliases
        'navy-950': '#111111',
        'navy-900': '#2A2A2A',
        'gold-500': '#d4a248',
        'emart-pink': '#e8197a',
        'emart-dark': '#111111',
        'emart-light': '#F8E6EA',
        'lumiere': {
          'primary': '#111111',
          'primary-hover': '#000000',
          'primary-light': '#F3F1EC',
          'secondary': '#e8197a',
          'secondary-hover': '#c01264',
          'secondary-light': '#F8E6EA',
          'background': '#FAFAF8',
          'background-dark': '#F3F1EC',
          'background-gray': '#F3F1EC',
          'accent': '#d4a248',
          'accent-light': '#F5ECD4',
          'text-primary': '#111111',
          'text-secondary': '#6B6B6B',
          'text-tertiary': '#9A9A9A',
          'white': '#FFFFFF',
          'border-light': 'rgba(17,17,17,0.10)',
          'border-medium': '#EDEAE3',
        },
      },
      fontFamily: {
        sans: ['var(--font-body-loaded)', '"DM Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        body: ['var(--font-body-loaded)', '"DM Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        display: ['var(--font-display-loaded)', '"Playfair Display"', 'Georgia', '"Noto Serif Bengali"', 'serif'],
        mono: ['var(--font-mono-loaded)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        poppins: ['var(--font-body-loaded)', '"DM Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        bengali: ['"Hind Siliguri"', 'sans-serif'],
        serif: ['var(--font-display-loaded)', '"Playfair Display"', 'Georgia', 'serif'],
        'sans-jakarta': ['var(--font-body-loaded)', '"DM Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.06)',
        pop: '0 20px 48px rgba(17,17,17,0.12)',
      },
    },
  },
  plugins: [],
};
