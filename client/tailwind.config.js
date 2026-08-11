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
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#0066ff',
          700: '#0052cc',
          800: '#1e40af',
          900: '#1e3a8a',
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
