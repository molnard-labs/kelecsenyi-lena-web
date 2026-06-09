/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Jost", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        lena: {
          bg: "#fdf9f4",
          lilac: "#f5edfc",
          peach: "#fff4eb",
          purple: "#7558c0",
          deep: "#4a2d9c",
          gold: "#c9883a",
          goldLight: "#e8b55a",
          sun: "#f5c030",
          text: "#2a1550",
          soft: "#604880",
          muted: "#a090c8",
          card: "#ffffff",
          rose: "#e0748e",
        },
      },
      boxShadow: {
        soft: "0 4px 28px rgba(100, 70, 180, 0.09)",
      },
    },
  },
  plugins: [],
};
