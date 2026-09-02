import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        cream: "#f7f4ee",
        gold: "#c9a227",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(17, 17, 17, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
