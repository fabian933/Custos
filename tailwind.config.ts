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
        cream: {
          50: "#fffdf7",
          100: "#fdf7e9",
          200: "#f7e9c6",
          300: "#efdcb0",
        },
        // Plum-grey: text, headings, primary buttons.
        navy: {
          50: "#f5f0f2",
          100: "#e7dee2",
          200: "#d2c6cc",
          300: "#ab9ca4",
          400: "#8a7b84",
          500: "#6e606a",
          600: "#5c4f59",
          700: "#4d424c",
          800: "#3e353d",
          900: "#2f282e",
        },
        // Soft blue: panels, accents, the shield, answered states, the proof chip.
        teal: {
          50: "#f3f7fb",
          100: "#e3ecf5",
          200: "#cbdcec",
          300: "#b6cadf",
          400: "#8fadca",
          500: "#6c8fb4",
          600: "#4e7199",
          700: "#3c5a7b",
          800: "#324861",
          900: "#2a3a4c",
        },
        emerald: {
          50: "#f3f7fb",
          100: "#e3ecf5",
          200: "#cbdcec",
          300: "#b6cadf",
          400: "#8fadca",
          500: "#6c8fb4",
          600: "#4e7199",
          700: "#3c5a7b",
          800: "#324861",
          900: "#2a3a4c",
        },
        // Dusty rose: refusals only.
        red: {
          50: "#fbf2f2",
          100: "#f5e2e2",
          200: "#eccccc",
          300: "#ddaeae",
          400: "#c98b8b",
          500: "#b57272",
          600: "#9c5c5c",
          700: "#7f4b4b",
          800: "#663d3d",
          900: "#533333",
        },
      },
      keyframes: {
        "flow-out": {
          "0%": { transform: "translateX(-14px)", opacity: "0" },
          "40%, 60%": { opacity: "1" },
          "100%": { transform: "translateX(14px)", opacity: "0" },
        },
        "flow-back": {
          "0%": { transform: "translateX(14px)", opacity: "0" },
          "40%, 60%": { opacity: "1" },
          "100%": { transform: "translateX(-14px)", opacity: "0" },
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
        "flow-back": "flow-back 1.8s ease-in-out infinite",
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
