import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./{app,components}/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Syne", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "spin": "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
