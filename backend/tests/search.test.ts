// Mock aiService before imports
jest.mock("../src/services/aiService", () => ({
  aiService: {
    processQuery: jest.fn(),
  },
}));

import request from "supertest";
import express from "express";
import searchRouter from "../src/api/endpoints/search";
import authRouter from "../src/api/endpoints/auth";
import { initDatabase } from "../src/core/database";
import { User } from "../src/models/user";
import { hashPassword } from "../src/core/security";
import { aiService } from "../src/services/aiService";

const app = express();
app.use(express.json());
app.use("/api/v1", authRouter);
app.use("/api/v1/search", searchRouter);

describe("Search Endpoints", () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });

    const hashedPassword = await hashPassword("testpass123");
    const user = await User.create({
      email: "test@example.com",
      hashed_password: hashedPassword,
      full_name: "Test User",
      language: "en",
    });
    userId = user.id;

    const loginResponse = await request(app).post("/api/v1/login").send({
      username: "test@example.com",
      password: "testpass123",
    });

    authToken = loginResponse.body.access_token;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe("POST /api/v1/search", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/search")
        .send({ query: "test", language: "en" });

      expect(response.status).toBe(401);
    });

    it("should handle Tenerife queries", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [
          {
            section: "Beaches",
            points: ["Playa de las Americas", "Los Cristianos"],
          },
        ],
      });

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "best beaches in Tenerife", language: "en" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(aiService.processQuery).toHaveBeenCalledWith(
        "best beaches in Tenerife",
        false,
        "en"
      );
    });

    it("should detect off-topic queries", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [],
        off_topic: true,
        message: "Sorry, I can only help with Tenerife information",
      });

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "weather in Madrid", language: "en" });

      expect(response.status).toBe(200);
      expect(response.body.off_topic).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    it("should handle suggestion queries", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [
          {
            section: "Activities",
            points: ["Visit Mount Teide", "Explore Anaga Forest"],
          },
        ],
      });

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "hiking", language: "en", is_suggestion: true });

      expect(response.status).toBe(200);
      expect(aiService.processQuery).toHaveBeenCalledWith("hiking", true, "en");
    });

    it("should support Spanish language", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [
          {
            section: "Playas",
            points: ["Playa de las Teresitas"],
          },
        ],
      });

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "playas de Tenerife", language: "es" });

      expect(response.status).toBe(200);
      expect(aiService.processQuery).toHaveBeenCalledWith(
        "playas de Tenerife",
        false,
        "es"
      );
    });

    it("should support Italian language", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [
          {
            section: "Spiagge",
            points: ["Playa del Duque"],
          },
        ],
      });

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "spiagge di Tenerife", language: "it" });

      expect(response.status).toBe(200);
      expect(aiService.processQuery).toHaveBeenCalledWith(
        "spiagge di Tenerife",
        false,
        "it"
      );
    });

    it("should reject invalid request body", async () => {
      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ invalid: "data" });

      expect(response.status).toBe(400);
    });

    it("should require query field", async () => {
      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ language: "en" });

      expect(response.status).toBe(400);
    });

    it("should use default language when not provided", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [],
      });

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "test" });

      expect(response.status).toBe(200);
      expect(aiService.processQuery).toHaveBeenCalledWith("test", false, "es");
    });

    it("should handle AI service errors", async () => {
      (aiService.processQuery as jest.Mock).mockRejectedValue(
        new Error("AI Service Error")
      );

      const response = await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "test query", language: "en" });

      expect(response.status).toBe(500);
    });

    it("should default suggestion to false", async () => {
      (aiService.processQuery as jest.Mock).mockResolvedValue({
        results: [],
      });

      await request(app)
        .post("/api/v1/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "test", language: "en" });

      expect(aiService.processQuery).toHaveBeenCalledWith("test", false, "en");
    });
  });
});
