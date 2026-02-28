// Mock settings first
jest.mock("../src/core/config", () => ({
  settings: {
    OPENAI_API_KEY: "test-openai-key",
    PROJECT_NAME: "Test Project",
    API_V1_STR: "/api/v1",
    SECRET_KEY: "test-secret",
    ALGORITHM: "HS256",
    ACCESS_TOKEN_EXPIRE_MINUTES: 30,
    SQLALCHEMY_DATABASE_URI: "sqlite::memory:",
    TAVILY_API_KEY: "test-tavily-key",
    CORS_ORIGINS: ["*"],
    PORT: 8000,
  },
}));

// Mock OpenAI before any imports
const mockCreate = jest.fn();
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Mock searchService
jest.mock("../src/services/searchService", () => ({
  searchService: {
    searchWeb: jest.fn().mockResolvedValue("Search results about Tenerife"),
    searchImageForActivity: jest.fn().mockResolvedValue(null),
  },
}));

// Import after mocking
import { aiService } from "../src/services/aiService";
import { searchService } from "../src/services/searchService";

describe("AIService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReset();
  });

  describe("processQuery", () => {
    it("should process Tenerife-related query", async () => {
      // Mock checkTenerifeRelevance → related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      // Mock main OpenAI call → activities
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              results: [{ title: "Playa de las Américas", description: "Beautiful beach", price: "Free", link: null }],
            }),
          },
        }],
      });

      const result = await aiService.processQuery("best beaches", false, "en");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(searchService.searchWeb).toHaveBeenCalled();
    });

    it("should detect off-topic queries", async () => {
      // Mock checkTenerifeRelevance → not related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: false }) } }],
      });

      const result = await aiService.processQuery(
        "weather in Madrid",
        false,
        "en",
      );

      expect(result).toBeDefined();
      expect(result.off_topic).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.results).toEqual([]);
    });

    it("should handle suggestion queries", async () => {
      // Suggestions skip relevance check → single OpenAI call for main query
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
      });

      const result = await aiService.processQuery("hiking", true, "en");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("should support Spanish language", async () => {
      // Mock checkTenerifeRelevance → related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      // Mock main query
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          results: [{ title: "Playa de las Teresitas", description: "Una hermosa playa", price: "Free", link: null }],
        }) } }],
      });

      const result = await aiService.processQuery("playas", false, "es");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("results");
      expect(result.results.length).toBeGreaterThan(0);
    });

    it("should support Italian language", async () => {
      // Mock checkTenerifeRelevance → related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      // Mock main query
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          results: [{ title: "Playa del Duque", description: "Una bellissima spiaggia", price: "Free", link: null }],
        }) } }],
      });

      const result = await aiService.processQuery("spiagge", false, "it");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("results");
      expect(result.results.length).toBeGreaterThan(0);
    });

    it("should handle empty query as off-topic", async () => {
      // Mock checkTenerifeRelevance → not related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: false }) } }],
      });

      const result = await aiService.processQuery("random stuff", false, "en");

      expect(result).toBeDefined();
      expect(result.off_topic).toBe(true);
      expect(result.message).toContain("Tenerife");
      expect(result.results).toEqual([]);
    });

    it("should handle OpenAI API errors", async () => {
      // Mock checkTenerifeRelevance → related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      // Mock main query → throws generic error → service returns { results: [] }
      mockCreate.mockRejectedValueOnce(new Error("OpenAI API Error"));

      const result = await aiService.processQuery("test", false, "en");

      expect(result).toBeDefined();
      expect(result.results).toEqual([]);
    });

    it("should enhance query with Tenerife for suggestions", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                query: "restaurants a Tenerife",
                language: "en",
              }),
            },
          },
        ],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  section: "Restaurants",
                  points: ["La Bodega", "El Rincón"],
                },
              ]),
            },
          },
        ],
      });

      const result = await aiService.processQuery("restaurants", true, "en");

      expect(result).toBeDefined();
      expect(searchService.searchWeb).toHaveBeenCalledWith(
        expect.stringContaining("Tenerife"),
      );
    });

    it("should allow query when checkTenerifeRelevance throws error (default true)", async () => {
      // checkTenerifeRelevance will throw → defaults to true → query proceeds
      mockCreate.mockRejectedValueOnce(new Error("Network error"));

      // Main query
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                activities: [
                  { title: "Teide", description: "Volcano", price: "Free" },
                ],
              }),
            },
          },
        ],
      });

      const result = await aiService.processQuery("teide volcano", false, "en");

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    it("should use fallback off-topic message for unknown language", async () => {
      // Off-topic check → not related
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: false }) } }],
      });

      // Use language "fr" which is not in offTopicMessages → falls back to "es"
      const result = await aiService.processQuery(
        "weather in Paris",
        false,
        "fr",
      );

      expect(result.off_topic).toBe(true);
      expect(result.message).toContain("Tenerife"); // Spanish fallback message
    });

    it("should allow query when checkTenerifeRelevance returns null content (defaults to related)", async () => {
      // null content → service uses fallback '{"is_tenerife_related":true}' → proceeds with query
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });
      // Main query
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
      });

      const result = await aiService.processQuery("random test", false, "en");

      expect(result.off_topic).toBeFalsy(); // null defaults to "related"
      expect(result.results).toBeDefined();
    });

    it("should handle empty searchContext using fallback message", async () => {
      const {
        searchService: mockSearchSvc,
      } = require("../src/services/searchService");
      mockSearchSvc.searchWeb.mockResolvedValueOnce(""); // empty context

      // Relevance check passes
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      // Main OpenAI call returns empty results
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
      });

      const result = await aiService.processQuery("tenerife test", false, "en");

      expect(result).toBeDefined();
      expect(result.results).toEqual([]);
    });

    it("should handle null completion content using empty results fallback", async () => {
      // Relevance check passes
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      // Main call returns null content → falls back to '{"results": []}'
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await aiService.processQuery("tenerife", false, "en");

      expect(result).toBeDefined();
      expect(result.results).toEqual([]);
    });

    it("should use default parameter values when called with only query", async () => {
      // Covers default params (isSuggestion=false, language="es")
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
      });

      const result = await aiService.processQuery("tenerife beach");

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    it("should skip tenerife enhancement for suggestions already containing tenerife", async () => {
      // isSuggestion=true AND query already contains "tenerife" → no append
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
      });

      const result = await aiService.processQuery(
        "visit tenerife beach",
        true,
        "en",
      );

      expect(result).toBeDefined();
    });

    it("should use fallback values for missing activity fields", async () => {
      // Covers a.title || "Unknown Activity", a.description || "", a.price || "Varies"
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ is_tenerife_related: true }) } }],
      });
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          results: [{ link: "https://example.com" }], // missing title, description, price
        }) } }],
      });

      const result = await aiService.processQuery("tenerife test", false, "en");

      expect(result.results[0].title).toBe("Unknown Activity");
      expect(result.results[0].description).toBe("");
      expect(result.results[0].price).toBe("Varies");
    });
  });
});
