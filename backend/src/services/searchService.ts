/**
 * Search Service Module
 *
 * Tavily web search integration for activity discovery.
 * Matches Python backend's SearchService functionality exactly.
 */

import axios from "axios";
import { settings } from "../core/config";

class SearchService {
  /**
   * Search the web using Tavily API (no images)
   */
  async searchWeb(query: string): Promise<string> {
    if (!settings.TAVILY_API_KEY) {
      console.warn("⚠️ Tavily API key not configured");
      return "";
    }

    try {
      const response = await axios.post(
        "https://api.tavily.com/search",
        {
          query,
          api_key: settings.TAVILY_API_KEY,
          search_depth: "advanced",
          max_results: 5,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const results = response.data.results || [];
      console.log(`[SearchService] Got ${results.length} results for: ${query}`);

      let context = "";
      for (const r of results) {
        const text = r.content || r.snippet || "";
        if (text) context += `Title: ${r.title || ""}\nURL: ${r.url || ""}\nContent: ${text}\n\n`;
      }
      return context;
    } catch (error: any) {
      console.error("❌ Tavily search error:", error.message);
      return "";
    }
  }

  /**
   * Search for a real image URL for a specific activity using Tavily with include_images=true.
   * Mirrors Python backend's search_image_for_activity exactly.
   */
  async searchImageForActivity(title: string, location: string = ""): Promise<string | null> {
    if (!settings.TAVILY_API_KEY) return null;

    const searchQuery = `Tenerife ${title} ${location}`.trim();
    console.log(`[SearchService] Searching image for: ${searchQuery}`);

    try {
      const response = await axios.post(
        "https://api.tavily.com/search",
        {
          api_key: settings.TAVILY_API_KEY,
          query: searchQuery,
          search_depth: "basic",
          include_images: true,
          max_results: 3,
        },
        { timeout: 10000 }
      );

      const images: string[] = response.data.images || [];
      if (images.length > 0) {
        console.log(`[SearchService] Found Tavily image: ${images[0]}`);
        return images[0];
      }
    } catch (error: any) {
      console.error(`❌ Tavily image search error: ${error.message}`);
    }

    return null;
  }

  private _getMockData(): string {
    return `
    Mock Search Results for Tenerife:
    1. Teide National Park Stargazing Tour. Price: 50 EUR. Description: Watch the stars from the highest peak in Spain. Link: https://example.com/teide
    2. Whale Watching Catamaran. Price: 35 EUR. Description: See whales and dolphins in their natural habitat. Link: https://example.com/whales
    3. Siam Park Tickets. Price: 40 EUR. Description: The best water park in the world. Link: https://example.com/siam
    4. Masca Valley Hike. Price: Free. Description: Beautiful hike in a deep ravine. Link: https://example.com/masca
    `;
  }
}

export const searchService = new SearchService();
