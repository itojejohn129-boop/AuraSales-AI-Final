import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 18s linear infinite',
      },
      colors: {
        slate: {
          "950": "#03071e",
          "900": "#0f1117",
          "800": "#161b22",
          "700": "#21262d",
          "600": "#30363d",
          "500": "#484f58",
          "400": "#6e7681",
          "300": "#8b949e",
          "200": "#c9d1d9",
          "100": "#e6edf3",
          "50": "#f0f6fc",
        },
        blue: {
          "600": "#1f6feb",
          "500": "#388bfd",
          "400": "#58a6ff",
        },
      },
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
