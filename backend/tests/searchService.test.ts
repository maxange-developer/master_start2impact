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

import axios from "axios";

// Mock axios before importing the service
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import service after mocking
import { searchService } from "../src/services/searchService";

describe("SearchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchWeb", () => {
    it("should return search results when API key is configured", async () => {
      const mockResponse = {
        data: {
          results: [
            {
              title: "Test Result 1",
              url: "https://example.com/1",
              content: "Test content 1",
            },
            {
              title: "Test Result 2",
              url: "https://example.com/2",
              content: "Test content 2",
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchService.searchWeb("test query");

      expect(typeof result).toBe("string");
      expect(result).toContain("Test content 1");
      expect(result).toContain("Test content 2");
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://api.tavily.com/search",
        expect.objectContaining({
          query: "test query",
          api_key: "test-tavily-key",
          search_depth: "advanced",
          max_results: 5,
        }),
        expect.any(Object),
      );
    });

    it("should handle empty results", async () => {
      const mockResponse = {
        data: {
          results: [],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchService.searchWeb("test query");

      expect(result).toBe("");
    });

    it("should handle API errors gracefully", async () => {
      mockedAxios.post.mockRejectedValue(new Error("API Error"));

      const result = await searchService.searchWeb("test query");

      expect(result).toBe("");
    });

    it("should concatenate multiple results", async () => {
      const mockResponse = {
        data: {
          results: [
            { content: "Result 1 content" },
            { content: "Result 2 content" },
            { content: "Result 3 content" },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchService.searchWeb("Tenerife beaches");

      expect(typeof result).toBe("string");
      expect(result).toContain("Result 1 content");
      expect(result).toContain("Result 2 content");
      expect(result).toContain("Result 3 content");
    });

    it("should use correct search parameters", async () => {
      const mockResponse = {
        data: { results: [{ content: "Test" }] },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await searchService.searchWeb("Tenerife beaches");

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://api.tavily.com/search",
        {
          query: "Tenerife beaches",
          api_key: "test-tavily-key",
          search_depth: "advanced",
          max_results: 5,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });

    it("should handle results with snippet instead of content", async () => {
      const mockResponse = {
        data: {
          results: [
            { snippet: "Snippet content 1" },
            { snippet: "Snippet content 2" },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchService.searchWeb("test");

      expect(result).toContain("Snippet content 1");
      expect(result).toContain("Snippet content 2");
    });

    it("should use empty string for results with no content or snippet", async () => {
      // Covers the `|| ""` fallback branch in map
      const mockResponse = {
        data: {
          results: [
            { other_field: "value" }, // no content, no snippet → ""
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchService.searchWeb("test");

      expect(result).toBe("");
    });

    it("should use empty array fallback when results field is undefined", async () => {
      // Covers the `|| []` branch when response.data.results is undefined
      const mockResponse = {
        data: {}, // no results field at all
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchService.searchWeb("test");

      expect(result).toBe("");
    });
  });

  describe("searchWeb - no API key branch", () => {
    it("should return empty string when TAVILY_API_KEY is empty", async () => {
      // Temporarily clear the API key on the mock settings object
      const { settings } = require("../src/core/config");
      const originalKey = settings.TAVILY_API_KEY;
      settings.TAVILY_API_KEY = "";

      try {
        const result = await searchService.searchWeb("test query");
        expect(result).toBe("");
        expect(mockedAxios.post).not.toHaveBeenCalled();
      } finally {
        settings.TAVILY_API_KEY = originalKey;
      }
    });
  });
});
