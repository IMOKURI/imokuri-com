import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
    site: "https://imokuri.com",
    integrations: [tailwind(), sitemap(), mdx()],
    markdown: {
        shikiConfig: {
            theme: "nord",
        },
    },
});
