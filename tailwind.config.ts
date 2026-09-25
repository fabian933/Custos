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
        // Warm sand: the page background.
        cream: {
          50: "#ffffff",
          100: "#f8f5f1",
          200: "#f3eee8",
          300: "#e7e0d7",
        },
        // Deep navy: text, headings, primary buttons.
        navy: {
          50: "#f1eff6",
          100: "#e3dfec",
          200: "#cfc9dd",
          300: "#403763",
          400: "#453c69",
          500: "#4a4270",
          600: "#241a55",
          700: "#19123d",
          800: "#130e2e",
          900: "#0d0920",
        },
        // Pale green panels, with lime for positive states and navy for solid fills.
        teal: {
          50: "#f4f9ec",
          100: "#e8f3da",
          200: "#baddcf",
          300: "#baddcf",
          400: "#b2f332",
          500: "#19123d",
          600: "#19123d",
          700: "#130e2e",
          800: "#19123d",
          900: "#0d0920",
        },
        // Lime: answered states, verified badges, proof accents. Always with navy text.
        emerald: {
          50: "#f7fdea",
          100: "#eefbd1",
          200: "#e0f8ab",
          300: "#cbf56d",
          400: "#b2f332",
          500: "#b2f332",
          600: "#b2f332",
          700: "#19123d",
          800: "#19123d",
          900: "#0d0920",
        },
        // Slate blue: refusals and secondary accents.
        red: {
          50: "#eef2f7",
          100: "#dfe7f0",
          200: "#cbd8e6",
          300: "#a9bed5",
          400: "#6787af",
          500: "#6787af",
          600: "#6787af",
          700: "#3c5878",
          800: "#2f465f",
          900: "#243546",
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
