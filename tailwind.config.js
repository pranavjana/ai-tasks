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
      typography: {
        DEFAULT: {
          css: {
            color: '#ECECF1',
            a: {
              color: '#9333EA',
              '&:hover': {
                color: '#A855F7',
              },
            },
            strong: {
              color: '#FFFFFF',
            },
            h1: {
              color: '#FFFFFF',
            },
            h2: {
              color: '#FFFFFF',
            },
            h3: {
              color: '#FFFFFF',
            },
            h4: {
              color: '#FFFFFF',
            },
            code: {
              color: '#FFFFFF',
            },
            blockquote: {
              color: '#D1D5DB',
              borderLeftColor: '#4B5563',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
} 