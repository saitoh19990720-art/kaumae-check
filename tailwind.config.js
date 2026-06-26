/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2F6FE0", // はっきり読める青（高齢者にもAA）
        "brand-soft": "#EAF3FF",
        ink: "#1F2937",
        sub: "#5B6776",
      },
      fontFamily: {
        jp: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
