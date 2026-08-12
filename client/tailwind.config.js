/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '380px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Instagram's real signature blue (#0095F6), mapped over Tailwind's
        // stock `blue` scale so every existing `bg-blue-600`, `text-blue-500`,
        // etc. class across the app renders the authentic IG color.
        blue: {
          50: '#E6F4FE',
          100: '#CCE9FD',
          200: '#99D3FB',
          300: '#66BDF9',
          400: '#33A7F7',
          500: '#0095F6',
          600: '#0095F6',
          700: '#1877C9',
          800: '#0B5A96',
          900: '#073E68',
        },
        brand: {
          50: '#E6F4FE',
          100: '#CCE9FD',
          500: '#0095F6',
          600: '#0095F6',
          700: '#1877C9',
          800: '#0B5A96',
          900: '#073E68',
        },
        app: 'var(--bg-app)',
        card: 'var(--bg-card)',
        sidebar: 'var(--bg-sidebar)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
      },
      textColor: {
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
