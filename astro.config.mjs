import { defineConfig, fontProviders, svgoOptimizer } from "astro/config"
import { satteri, satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri"
import sitemap from "@astrojs/sitemap"
import astroExpressiveCode from "astro-expressive-code"
import mdx from "@astrojs/mdx"
import tailwindcss from "@tailwindcss/vite"
import { satteriToc } from "./src/plugins/satteri-toc.mjs"
import { satteriCallouts } from "./src/plugins/satteri-callouts.mjs"
import { satteriExternalLinks } from "./src/plugins/satteri-external-links.mjs"

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
    processor: satteri({
      mdastPlugins: [satteriToc()],
      hastPlugins: [satteriHeadingIdsPlugin(), satteriCallouts, satteriExternalLinks]
    })
  },

  vite: {
    plugins: [tailwindcss()]
  },

  image: {
    responsiveStyles: true,
    layout: "constrained"
  },

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
  ],

  experimental: {
    svgOptimizer: svgoOptimizer()
  }
})
