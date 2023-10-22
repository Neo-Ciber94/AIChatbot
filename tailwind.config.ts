import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import { customShadows, rainbowBorder } from "./tailwind/plugins";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "475px",
        ...defaultTheme.screens,
      },
    },
  },
  plugins: [rainbowBorder, customShadows],
};
export default config;
