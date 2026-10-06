import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eefbf4",
          100: "#d7f6e4",
          200: "#b2eccd",
          300: "#7edcaf",
          400: "#44c38d",
          500: "#10b981", // Emerald / Electric green
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          accent: "#00f59b"
        },
        navy: {
          800: "#1e293b",
          850: "#141e30",
          900: "#0f172a",
          950: "#0b0f19", // Deep Navy / Charcoal
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
