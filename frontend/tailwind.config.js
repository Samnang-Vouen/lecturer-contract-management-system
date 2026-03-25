/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Kantumruy Pro', 'Segoe UI', 'Arial', 'sans-serif'],
        khmer: ['Kantumruy Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
