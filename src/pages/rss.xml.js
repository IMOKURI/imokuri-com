import rss from "@astrojs/rss";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";
import { getCollection } from "astro:content";

export async function GET() {
  const blog = (await getCollection("blog"))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 5);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: blog.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.data.date.getFullYear()}/${(
        post.data.date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${post.id}/`,
    })),
  });
}
