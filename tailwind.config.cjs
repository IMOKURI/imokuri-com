/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        latte: {
          primary: "#8839ef", // Mauve
          secondary: "#ea76cb", // Pink
          accent: "#179299", // Teal
          neutral: "#4c4f69", // Text
          "base-100": "#eff1f5", // Base
          "base-200": "#e6e9ef", // Mantle
          "base-300": "#dce0e8", // Crust
          info: "#04a5e5", // Sky
          success: "#40a02b", // Green
          warning: "#df8e1d", // Yellow
          error: "#e64553", // Maroon
        },
        frappe: {
          primary: "#ca9ee6", // Mauve
          secondary: "#f4b8e4", // Pink
          accent: "#81c8be", // Teal
          neutral: "#c6d0f5", // Text
          "base-100": "#303446", // Base
          "base-200": "#292c3c", // Mantle
          "base-300": "#232634", // Crust
          info: "#99d1db", // Sky
          success: "#a6d189", // Green
          warning: "#e5c890", // Yellow
          error: "#ea999c", // Maroon
        },
      },
    ],
  },
};
