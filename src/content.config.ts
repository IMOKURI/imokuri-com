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

const projectSchema = z.object({
    title: z.string(),
    description: z.string()
})

export type BlogSchema = z.infer<typeof blogSchema>
export type ProjectSchema = z.infer<typeof projectSchema>

const blogCollection = defineCollection({
    loader: glob({ pattern: "[^_]*", base: "./src/content/blog" }),
    schema: blogSchema
})
const projectCollection = defineCollection({
    loader: glob({ pattern: "[^_]*", base: "./src/content/project" }),
    schema: projectSchema
})

export const collections = {
    blog: blogCollection,
    project: projectCollection
}
