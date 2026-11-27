/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4fe",
          100: "#dbe4fd",
          200: "#bed0fb",
          300: "#91b3f8",
          400: "#5e8df3",
          500: "#3b6cec",
          600: "#2750e0",
          700: "#1f3ec8",
          800: "#1e34a2",
          900: "#1d307f",
          950: "#131d4e"
        },
        purple: {
          50: "#fbf6fe",
          100: "#f4eafc",
          500: "#9333ea",
          600: "#7e22ce",
          700: "#6b21a8"
        }
      }
    },
  },
  plugins: [],
};
