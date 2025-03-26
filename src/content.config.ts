import { z, defineCollection } from "astro:content"
import { glob } from "astro/loaders"

const blogSchema = z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    cover_image: z.string().optional(),
    tags: z.string().array()
})

const activitySchema = z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string()
})

export type BlogSchema = z.infer<typeof blogSchema>
export type ActivitySchema = z.infer<typeof activitySchema>

const blogCollection = defineCollection({
    loader: glob({ pattern: "[^_]*", base: "./src/content/blog" }),
    schema: blogSchema
})
const activityCollection = defineCollection({
    loader: glob({ pattern: "[^_]*", base: "./src/content/activity" }),
    schema: activitySchema
})

export const collections = {
    blog: blogCollection,
    activity: activityCollection
}
