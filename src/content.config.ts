import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const work = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    year: z.number(),
    type: z.string(),
    summary: z.string(),
    cover: z.string().url(),
    coverAlt: z.string(),
    featured: z.boolean().default(false)
  })
});

const notes = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false)
  })
});

export const collections = { work, notes };
