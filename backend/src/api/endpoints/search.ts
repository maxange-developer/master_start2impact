/**
 * Search Endpoint Module
 *
 * AI-powered activity search endpoint.
 * POST /api/v1/search - Process natural language search queries
 */

import { Router, Response } from "express";
import { getCurrentUser, AuthRequest } from "../deps";
import { aiService } from "../../services/aiService";
import { SearchRequestSchema } from "../../schemas/search";

const router = Router();

/**
 * AI-powered search endpoint
 *
 * POST /api/v1/search
 * Headers: Authorization: Bearer <token>
 * Body: { query: string, is_suggestion?: boolean, language?: string }
 * Returns: { results: Activity[], off_topic?: boolean, message?: string }
 */
router.post("/", getCurrentUser, async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const parsed = SearchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ detail: "Invalid input", errors: parsed.error.errors });
    }

    const { query, is_suggestion = false, language } = parsed.data;

    // Process query with AI service
    const results = await aiService.processQuery(
      query,
      is_suggestion,
      language,
    );

    return res.json(results);
  } catch (error: any) {
    if (error.message === "AI_QUOTA_EXCEEDED") {
      return res.status(503).json({
        detail: "AI service quota exceeded. Please add credits to the OpenAI account.",
        code: "AI_QUOTA_EXCEEDED",
      });
    }
    if (error.message === "AI_INVALID_KEY") {
      return res.status(503).json({
        detail: "AI service configuration error. Please check the API key.",
        code: "AI_INVALID_KEY",
      });
    }
    console.error("❌ Search error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
