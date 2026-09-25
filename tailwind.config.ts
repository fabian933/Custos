import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f2f5f9",
          100: "#e3e9f1",
          200: "#c5d2e3",
          300: "#93a9c6",
          400: "#5c7ba4",
          500: "#3a5b85",
          600: "#2a466b",
          700: "#1d3555",
          800: "#152740",
          900: "#0e1b2e",
        },
        teal: {
          50: "#eefbf8",
          100: "#d3f4ed",
          200: "#a7e9db",
          300: "#6ed6c4",
          400: "#35bba7",
          500: "#189e8c",
          600: "#0f7e72",
          700: "#11655d",
          800: "#12514b",
          900: "#12443f",
        },
      },
      keyframes: {
        "flow-out": {
          "0%": { transform: "translateX(-14px)", opacity: "0" },
          "40%, 60%": { opacity: "1" },
          "100%": { transform: "translateX(14px)", opacity: "0" },
        },
        "pulse-chevron": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
        "chip-in": {
          from: { transform: "translateY(4px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "flow-out": "flow-out 1.8s ease-in-out infinite",
        "pulse-chevron": "pulse-chevron 1.4s ease-in-out infinite",
        "chip-in": "chip-in 0.45s ease-out both",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
