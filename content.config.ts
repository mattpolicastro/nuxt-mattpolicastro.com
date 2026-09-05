import { defineCollection, z } from '@nuxt/content'

const postSchema = z.object({
  title: z.string(),
  date: z.string(), // ISO 8601 date string, e.g. "2025-03-01"
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export const collections = {
  posts: defineCollection({
    type: 'page',
    source: {
      include: 'posts/*.md',
      exclude: ['posts/_*.md'], // files prefixed with _ are treated as drafts
    },
    schema: postSchema,
  }),
  // Drafts are indexed only by `nuxt dev`. This keeps their content out of
  // production builds while still allowing the local preview route to render.
  ...(process.env.NODE_ENV !== 'production' ? {
    drafts: defineCollection({
      type: 'page',
      source: 'drafts/*.md',
      schema: postSchema,
    }),
  } : {}),
}
