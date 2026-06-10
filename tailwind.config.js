/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        ink: {
          900: '#0A0A0B',
          700: '#26262A',
          500: '#5C5C66',
          300: '#A6A6AE',
          100: '#EAEAEC',
          50: '#F5F5F6',
        },
        amber: {
          50: '#FFF8EC',
          100: '#FDEEC8',
          200: '#FBD98B',
          300: '#F8C04D',
          400: '#F5A524',
          500: '#DB8A0F',
          600: '#B66A05',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        soft: '0 1px 0 rgba(10,10,11,0.04), 0 6px 24px -12px rgba(10,10,11,0.12)',
      },
    },
  },
  plugins: [],
};
