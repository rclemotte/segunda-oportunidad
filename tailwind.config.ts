import type { Config } from 'tailwindcss';

// Tokens de marca (Ángel, nov 2026). Cambiar la marca = cambiar estos valores.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        violeta: { DEFAULT: '#3A0D66', 600: '#4B1A80', 400: '#7A55A8', 100: '#EFE8F7' },
        lima: { DEFAULT: '#D9FF00', 600: '#C2E600' },
        carbon: { DEFAULT: '#2B2B2B', 500: '#6B6B76', 300: '#B9B6C2' },
        lavanda: '#EFE8F7',
        fondo: '#F8F6FB',
        ok: { DEFAULT: '#1F8A4C', bg: '#E3F5EA' },
        alerta: { DEFAULT: '#B26A00', bg: '#FFF2D9' },
        error: { DEFAULT: '#C2302B', bg: '#FCE6E5' },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        tarjeta: '20px',
      },
      boxShadow: {
        tarjeta: '0 1px 2px rgba(58,13,102,0.06), 0 4px 16px rgba(58,13,102,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
