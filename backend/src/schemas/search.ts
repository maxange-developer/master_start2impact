/**
 * Search Request/Response validation schemas
 */

import { z } from "zod";

export const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
  is_suggestion: z.boolean().optional(),
  language: z.string().optional().default("es"),
});

export type SearchRequestInput = z.infer<typeof SearchRequestSchema>;

/**
 * Activity result interface (matches Python SearchResponse schema)
 */
export interface ActivityResult {
  title: string;
  description: string;
  price: string;
  image_url: string | null;
  link: string | null;
  rating?: string;
  location?: string;
  duration?: string;
  category?: string;
}

/**
 * Search response interface
 */
export interface SearchResponse {
  results: ActivityResult[];
  off_topic?: boolean;
  message?: string;
}
