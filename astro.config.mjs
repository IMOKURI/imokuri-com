import { defineConfig, fontProviders } from "astro/config"
import sitemap from "@astrojs/sitemap"
import astroExpressiveCode from "astro-expressive-code"
import mdx from "@astrojs/mdx"
import tailwindcss from "@tailwindcss/vite"
import remarkToc from "remark-toc"
import rehypeCallouts from "rehype-callouts"
import rehypeExternalLinks from "rehype-external-links"
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs"

// https://astro.build/config
export default defineConfig({
  site: "https://imokuri.com",
  integrations: [
    sitemap(),
    astroExpressiveCode({
      themes: ["catppuccin-mocha", "catppuccin-frappe"],
      customizeTheme: theme => {
        if (theme.name === "catppuccin-mocha") {
          theme.name = "frappe"
        } else if (theme.name === "catppuccin-frappe") {
          theme.name = "latte"
        }
        return theme
      },
      defaultProps: {
        wrap: true,
        preserveIndent: true
      },
      styleOverrides: {
        codeFontFamily: "var(--font-mplus1-code)",
        uiFontFamily: "var(--font-mplus1-code)"
      }
    }),
    mdx()
  ],

  markdown: {
    remarkPlugins: [remarkReadingTime, [remarkToc, { maxDepth: 3 }]],
    rehypePlugins: [
      [rehypeCallouts, { theme: "github" }],
      [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]
    ]
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
