/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bluebook: {
          dark: '#1e2229',
          bg: '#f3f4f6',
          panel: '#ffffff',
          blue: '#0070ba',
          hoverBlue: '#005ea6',
          border: '#d1d5db',
          darkBorder: '#374151',
          accent: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
}
