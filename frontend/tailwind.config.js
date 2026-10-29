/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent-primary)',
        'accent-hover': 'var(--accent-hover)',
        border: 'var(--border-subtle)',
      },
      fontFamily: {
        sans: 'var(--font-system)',
        serif: 'var(--font-reader-serif)',
      },
    },
  },
  plugins: [],
}

