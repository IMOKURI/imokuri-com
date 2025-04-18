import { defineConfig, fontProviders } from "astro/config"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"

import tailwindcss from "@tailwindcss/vite"

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
  },

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "M PLUS 2",
        cssVariable: "--font-mplus2"
      },
      {
        provider: fontProviders.fontsource(),
        name: "Monaspace Argon",
        cssVariable: "--font-monaspace-argon"
      }
    ]
  }
})
