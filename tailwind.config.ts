import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f3ffca',
        'primary-container': '#cafd00',
        'primary-dim': '#beee00',
        surface: '#0e0e0e',
        'surface-container-lowest': '#000000',
        'surface-container-low': '#131313',
        'surface-container': '#1a1919',
        'surface-container-high': '#201f1f',
        'surface-container-highest': '#262626',
        'surface-variant': '#262626',
        'on-surface': '#ffffff',
        'on-surface-variant': '#adaaaa',
        'on-primary': '#516700',
        'on-primary-fixed': '#3a4a00',
        'on-primary-container': '#4a5e00',
        'outline-variant': '#494847',
        outline: '#777575',
        error: '#ff7351',
        'error-container': '#b92902',
        secondary: '#e2e2e2',
      },
      fontFamily: {
        headline: ['Newsreader', 'Georgia', 'serif'],
        body: ['Space Grotesk', 'sans-serif'],
        label: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0.125rem',
        xl: '0.25rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

export default config
