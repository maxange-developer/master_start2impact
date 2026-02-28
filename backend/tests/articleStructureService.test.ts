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

// Import after mocking
import { articleStructureService } from "../src/services/articleStructureService";

describe("ArticleStructureService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("structureArticle", () => {
    it("should structure article content", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sections: [
                  { title: "Introduction", content: "Intro content" },
                  { title: "Details", content: "Detail content" },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        "Article content",
        "Article Title",
      );

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.length).toBe(2);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-3.5-turbo",
          response_format: { type: "json_object" },
        }),
      );
    });

    it("should handle empty content", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sections: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        "",
        "Title",
      );

      expect(result).toBeDefined();
      expect(result.sections).toEqual([]);
    });

    it("should handle long content", async () => {
      const longContent = "Lorem ipsum ".repeat(1000);
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sections: [
                  { title: "Part 1", content: "Content 1" },
                  { title: "Part 2", content: "Content 2" },
                  { title: "Part 3", content: "Content 3" },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        longContent,
        "Long Article",
      );

      expect(result).toBeDefined();
      expect(result.sections.length).toBe(3);
    });

    it("should handle OpenAI API errors", async () => {
      mockCreate.mockRejectedValue(new Error("API Error"));

      const result = await articleStructureService.structureArticle(
        "content",
        "title",
      );

      expect(result).toBeNull();
    });

    it("should handle null completion content using default empty sections", async () => {
      // Covers the `|| '{"sections": []}'` branch when content is null
      const mockResponse = {
        choices: [{ message: { content: null } }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        "content",
        "title",
      );

      // null content → parses '{"sections":[]}' → sections = []
      expect(result).toBeDefined();
    });

    it("should handle invalid JSON responses", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "invalid json",
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        "content",
        "title",
      );

      expect(result).toBeNull();
    });

    it("should handle content with special characters", async () => {
      const specialContent = "Content with émojis 🏖️ and spëciâl çhars";
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sections: [
                  { title: "Section", content: "Special content structured" },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        specialContent,
        "Special Title",
      );

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
    });

    it("should handle markdown content", async () => {
      const markdownContent =
        "# Heading\n\n**Bold text**\n\n- List item 1\n- List item 2";
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sections: [
                  {
                    title: "Formatted Section",
                    content: "Structured markdown",
                  },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await articleStructureService.structureArticle(
        markdownContent,
        "Markdown Article",
      );

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
    });
  });

  describe("structureArticle - no API key branch", () => {
    it("should return null when OPENAI_API_KEY is empty", async () => {
      // Temporarily clear the API key on the mock settings object
      const { settings } = require("../src/core/config");
      const originalKey = settings.OPENAI_API_KEY;
      settings.OPENAI_API_KEY = "";

      try {
        const result = await articleStructureService.structureArticle(
          "content",
          "title",
        );
        expect(result).toBeNull();
        expect(mockCreate).not.toHaveBeenCalled();
      } finally {
        settings.OPENAI_API_KEY = originalKey;
      }
    });
  });
});
