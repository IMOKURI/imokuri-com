import { defineConfig, fontProviders } from "astro/config"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import remarkToc from "remark-toc"
import rehypeCallouts from "rehype-callouts"
import rehypeExternalLinks from "rehype-external-links"
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs"

import tailwindcss from "@tailwindcss/vite"

// https://astro.build/config
export default defineConfig({
  site: "https://imokuri.com",
  integrations: [sitemap(), mdx()],

  markdown: {
    remarkPlugins: [remarkReadingTime, [remarkToc, { maxDepth: 3 }]],
    rehypePlugins: [
      [rehypeCallouts, { theme: "github" }],
      [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]
    ],
    shikiConfig: {
      theme: "nord"
    }
  },

  vite: {
    plugins: [tailwindcss()]
  },

  image: {
    responsiveStyles: true,
    layout: "constrained"
  },

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "M PLUS 2",
        cssVariable: "--font-mplus2"
      },
      {
        provider: fontProviders.google(),
        name: "M PLUS 1 Code",
        cssVariable: "--font-mplus1-code"
      }
    ]
  }
})
