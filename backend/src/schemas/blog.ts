/**
 * Blog Article validation schemas using Zod
 */

import { z } from "zod";

export const ArticleCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  language: z.string().min(2).max(10).default("es"),
  images: z.array(z.string()).optional(),
  structured_content: z.any().optional(),
  is_published: z.boolean().optional(),
});

export const ArticleUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  language: z.string().min(2).max(10).optional(),
  images: z.array(z.string()).optional(),
  structured_content: z.any().optional(),
  is_published: z.boolean().optional(),
});

export type ArticleCreateInput = z.infer<typeof ArticleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof ArticleUpdateSchema>;
