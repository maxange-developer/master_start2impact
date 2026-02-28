/**
 * Article Structure Service
 *
 * AI-powered article content structuring.
 * Uses OpenAI to organize article content into sections.
 */

import { OpenAI } from "openai";
import { settings } from "../core/config";

const openai = new OpenAI({
  apiKey: settings.OPENAI_API_KEY,
});

class ArticleStructureService {
  /**
   * Structure article content with AI
   * @param content Article content
   * @param title Article title
   * @returns Structured content with sections
   */
  async structureArticle(content: string, title: string): Promise<any> {
    try {
      if (!settings.OPENAI_API_KEY) {
        console.warn("⚠️ OpenAI API key not configured");
        return null;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are an expert content organizer. Structure the article content into logical sections with titles and content. Return JSON with "sections" array containing objects with "title" and "content" fields.',
          },
          {
            role: "user",
            content: `Article Title: ${title}\n\nContent:\n${content}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      return JSON.parse(
        completion.choices[0].message.content || '{"sections": []}'
      );
    } catch (error: any) {
      console.error("❌ Article structuring error:", error.message);
      return null;
    }
  }
}

export const articleStructureService = new ArticleStructureService();
