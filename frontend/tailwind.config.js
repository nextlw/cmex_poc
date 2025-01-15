/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        'secondary-hover': 'var(--color-secondary-hover)',
        danger: 'var(--color-danger)',
        'danger-hover': 'var(--color-danger-hover)',
        'background-dark': 'var(--color-background-dark)',
        'background-light': 'var(--color-background-light)',
        gray: {
          100: 'var(--color-gray-100)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          '800-50': 'var(--color-gray-800-50)',
        },
        blue: {
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
        },
      },
      spacing: {
        'sss': 'var(--sp-sss)',
        'ssm': 'var(--sp-ssm)',
        'smm': 'var(--sp-smm)',
        'sm': 'var(--sp-sm)',
        'smd': 'var(--sp-smd)',
        'sml': 'var(--sp-sml)',
        'smx': 'var(--sp-smx)',
        'md': 'var(--sp-md)',
        'lg': 'var(--sp-lg)',
        'xls': 'var(--sp-xls)',
        'xxs': 'var(--sp-xxs)',
        'xs': 'var(--sp-xs)',
        'xlm': 'var(--sp-xlm)',
        'xxm': 'var(--sp-xxm)',
        'xm': 'var(--sp-xm)',
        'xlg': 'var(--sp-xlg)',
      },
      maxWidth: {
        '7xl': 'var(--max-width-7xl)',
      },
      minHeight: {
        'screen': 'var(--min-height-screen)',
      },
      gridTemplateColumns: {
        '2': 'var(--grid-cols-2)',
      },
      gap: {
        '2': 'var(--gap-2)',
        '3': 'var(--gap-3)',
        '4': 'var(--gap-4)',
      },
      boxShadow: {
        'DEFAULT': '0 1px 3px 0 var(--color-shadow)',
        'md': '0 4px 6px -1px var(--color-shadow-md)',
      },
    },
  },
  plugins: [],
}
