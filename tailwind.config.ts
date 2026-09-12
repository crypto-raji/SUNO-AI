import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0C10",
          900: "#111318",
          800: "#181B22",
          700: "#22262F",
          600: "#2E3340",
        },
        paper: {
          100: "#F5F3EE",
          200: "#EDEAE2",
          300: "#D9D5C9",
        },
        signal: {
          DEFAULT: "#E8A33D",
          soft: "#F0C27A",
          dim: "#8A6A34",
        },
        line: "rgba(245,243,238,0.08)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
      },
      backdropBlur: {
        glass: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
