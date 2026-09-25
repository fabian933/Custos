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
        // Off-white: the page background.
        cream: {
          50: "#ffffff",
          100: "#fbfbfa",
          200: "#f6f5f2",
          300: "#ecebe7",
        },
        // Near-black text, with mid greys that hold 4.5:1 on the page background.
        navy: {
          50: "#f1f0ec",
          100: "#e6e5e1",
          200: "#d6d6d2",
          300: "#5c5c61",
          400: "#58585d",
          500: "#535358",
          600: "#2a2a2d",
          700: "#1c1c1e",
          800: "#141416",
          900: "#0b0b0c",
        },
        // Pale blue: panels, cards, subtle fills. Dark end for answered states and proof chips.
        teal: {
          50: "#f4f9fc",
          100: "#e4eef5",
          200: "#d3e4ef",
          300: "#bdd6e8",
          400: "#8fb4d0",
          500: "#3a3a3e",
          600: "#2a2a2d",
          700: "#232326",
          800: "#1c1c1e",
          900: "#141416",
        },
        emerald: {
          50: "#f2f2f0",
          100: "#e6e6e3",
          200: "#dadad6",
          300: "#c3c3be",
          400: "#4a4a4e",
          500: "#2f2f33",
          600: "#1c1c1e",
          700: "#18181a",
          800: "#1c1c1e",
          900: "#101012",
        },
        // Accent red: wordmark, primary buttons, the Without Custos state, refusals.
        red: {
          50: "#fdf3f2",
          100: "#fbe6e5",
          200: "#f8d2d0",
          300: "#f3b3b0",
          400: "#e20702",
          500: "#e20702",
          600: "#e20702",
          700: "#b80502",
          800: "#8e0402",
          900: "#6b0301",
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
