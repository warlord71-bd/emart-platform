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
          DEFAULT: '#D4596E',
          soft: '#F8E6EA',
          deep: '#A13F52',
        },
        primary: {
          50: '#FEF2F4',
          100: '#F8E6EA',
          500: '#D4596E',
          600: '#D4596E',
          700: '#A13F52',
        },
        brass: {
          DEFAULT: '#C9A961',
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
        'gold-500': '#C9A961',
        'emart-pink': '#D4596E',
        'emart-dark': '#111111',
        'emart-light': '#F8E6EA',
        'lumiere': {
          'primary': '#111111',
          'primary-hover': '#000000',
          'primary-light': '#F3F1EC',
          'secondary': '#D4596E',
          'secondary-hover': '#A13F52',
          'secondary-light': '#F8E6EA',
          'background': '#FAFAF8',
          'background-dark': '#F3F1EC',
          'background-gray': '#F3F1EC',
          'accent': '#C9A961',
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
