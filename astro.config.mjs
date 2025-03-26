import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://imokuri.com",
  integrations: [sitemap(), mdx()],

  markdown: {
    shikiConfig: {
      theme: "nord"
    }
  },

  vite: {
    plugins: [tailwindcss()]
  }
})