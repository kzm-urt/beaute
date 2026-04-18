/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#A8722A",
          light: "#D4A853",
          pale: "#F5E8D5",
        },
        beaute: {
          bg: "#F8F4EF",
          surface: "#FFFFFF",
          text: "#150B00",
          muted: "#8A7A6E",
          border: "#EDE5DC",
          nav: "#1A0E08",
        },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Hiragino Kaku Gothic ProN'", "'Noto Sans JP'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
