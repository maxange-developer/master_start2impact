/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        secondary: "#000000",
        accent: "#FFFFFF",
        background: "#000000",
        surface: "#FFFFFF",
        muted: "#9CA3AF",
      },
    },
  },
  plugins: [],
};
