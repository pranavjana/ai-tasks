/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#343541",
        foreground: "#ECECF1",
        primary: {
          DEFAULT: "#202123",
          hover: "#2A2B32",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#40414F",
          foreground: "#ECECF1",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.1)",
        }
      },
    },
  },
  plugins: [],
} 