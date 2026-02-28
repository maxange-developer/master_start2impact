import request from "supertest";
import express from "express";
import authRouter from "../src/api/endpoints/auth";
import { initDatabase } from "../src/core/database";
import { User } from "../src/models/user";
import { hashPassword } from "../src/core/security";

const app = express();
app.use(express.json());
app.use("/api/v1", authRouter);

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe("POST /api/v1/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/v1/register").send({
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        language: "en",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("email", "test@example.com");
      expect(response.body).toHaveProperty("full_name", "Test User");
      expect(response.body).not.toHaveProperty("hashed_password");
    });

    it("should reject registration with existing email", async () => {
      await request(app).post("/api/v1/register").send({
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        language: "en",
      });

      const response = await request(app).post("/api/v1/register").send({
        email: "test@example.com",
        password: "password456",
        full_name: "Another User",
        language: "en",
      });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBeDefined();
    });

    it("should reject registration with short password", async () => {
      const response = await request(app).post("/api/v1/register").send({
        email: "test@example.com",
        password: "short",
        full_name: "Test User",
        language: "en",
      });

      expect(response.status).toBe(400);
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app).post("/api/v1/register").send({
        email: "not-an-email",
        password: "password123",
        full_name: "Test User",
        language: "en",
      });

      expect(response.status).toBe(400);
    });

    it("should reject registration without required fields", async () => {
      const response = await request(app).post("/api/v1/register").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/register").send({
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        language: "en",
      });
    });

    it("should login with correct credentials", async () => {
      const response = await request(app).post("/api/v1/login").send({
        username: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("token_type", "bearer");
    });

    it("should reject login with wrong password", async () => {
      const response = await request(app).post("/api/v1/login").send({
        username: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBeDefined();
    });

    it("should reject login with non-existent email", async () => {
      const response = await request(app).post("/api/v1/login").send({
        username: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBeDefined();
    });

    it("should reject login without credentials", async () => {
      const response = await request(app).post("/api/v1/login").send({});

      expect(response.status).toBe(400);
    });

    it("should reject login for inactive user", async () => {
      // Create an inactive user directly
      const hashed = await hashPassword("password123");
      await User.create({
        email: "inactive@example.com",
        hashed_password: hashed,
        full_name: "Inactive User",
        is_active: false,
        language: "en",
      });

      const response = await request(app).post("/api/v1/login").send({
        username: "inactive@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/[Ii]nactive/);
    });
  });

  describe("GET /api/v1/me", () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app).post("/api/v1/register").send({
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        language: "en",
      });

      const loginResponse = await request(app).post("/api/v1/login").send({
        username: "test@example.com",
        password: "password123",
      });

      authToken = loginResponse.body.access_token;
    });

    it("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("email", "test@example.com");
      expect(response.body).toHaveProperty("full_name", "Test User");
      expect(response.body).not.toHaveProperty("hashed_password");
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/v1/me");

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should reject request with malformed header", async () => {
      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", "InvalidFormat");

      expect(response.status).toBe(401);
    });

    it("should reject request when user is deleted after token issued", async () => {
      // Delete user after getting token
      await User.destroy({ where: { email: "test@example.com" }, force: true });

      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(401);
    });

    it("should reject request when user is inactive", async () => {
      // Deactivate user
      await User.update(
        { is_active: false },
        { where: { email: "test@example.com" } },
      );

      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Error handling (DB failures)", () => {
    it("should return 500 on login when DB throws", async () => {
      jest
        .spyOn(User, "findOne")
        .mockRejectedValueOnce(new Error("DB connection error"));

      const response = await request(app).post("/api/v1/login").send({
        username: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on registration when DB create throws", async () => {
      jest
        .spyOn(User, "create")
        .mockRejectedValueOnce(new Error("DB create error"));

      const response = await request(app).post("/api/v1/register").send({
        email: "newuser@example.com",
        password: "password123",
        full_name: "New User",
        language: "en",
      });

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 401 on /me when DB throws during user lookup", async () => {
      // First get a valid token
      const hashedPw = await hashPassword("testpw123");
      await User.create({
        email: "db-error@example.com",
        hashed_password: hashedPw,
        full_name: "DB Error User",
        is_active: true,
        is_admin: false,
        language: "en",
      });
      const loginRes = await request(app).post("/api/v1/login").send({
        username: "db-error@example.com",
        password: "testpw123",
      });
      const token = loginRes.body.access_token;

      // Mock User.findByPk to throw (covers deps.ts catch block)
      jest
        .spyOn(User, "findByPk")
        .mockRejectedValueOnce(new Error("DB lookup error"));

      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      jest.restoreAllMocks();
    });
  });
});
