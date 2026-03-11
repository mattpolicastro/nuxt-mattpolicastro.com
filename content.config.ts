import { defineCollection, z } from '@nuxt/content'

export const collections = {
  posts: defineCollection({
    type: 'page',
    source: {
      include: 'posts/*.md',
      exclude: ['posts/_*.md'], // files prefixed with _ are treated as drafts
    },
    schema: z.object({
      title: z.string(),
      date: z.string(), // ISO 8601 date string, e.g. "2025-03-01"
      description: z.string().optional(),
      tags: z.array(z.string()).default([]),
    }),
  }),
}
