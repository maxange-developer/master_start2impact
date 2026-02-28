import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyToken,
} from "../src/core/security";

describe("Security Module", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });

    it("should handle empty password", async () => {
      const hashed = await hashPassword("test");
      const isValid = await verifyPassword("", hashed);

      expect(isValid).toBe(false);
    });
  });

  describe("createAccessToken", () => {
    it("should create a JWT token", () => {
      const userId = 1;
      const token = createAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should create different tokens for different users", () => {
      const token1 = createAccessToken(1);
      const token2 = createAccessToken(2);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify valid token", () => {
      const userId = 123;
      const token = createAccessToken(userId);
      const payload = verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(userId);
    });

    it("should reject invalid token", () => {
      const invalidToken = "invalid.token.here";
      const payload = verifyToken(invalidToken);

      expect(payload).toBeNull();
    });

    it("should reject malformed token", () => {
      const malformedToken = "not-a-jwt-token";
      const payload = verifyToken(malformedToken);

      expect(payload).toBeNull();
    });

    it("should reject empty token", () => {
      const payload = verifyToken("");

      expect(payload).toBeNull();
    });

    it("should reject JWT with missing sub field", () => {
      // Create a token signed with the correct secret but without sub
      const jwt = require("jsonwebtoken");
      const { settings } = require("../src/core/config");
      const tokenWithoutSub = jwt.sign(
        { data: "no-sub-field", exp: Math.floor(Date.now() / 1000) + 3600 },
        settings.SECRET_KEY,
      );
      const payload = verifyToken(tokenWithoutSub);

      expect(payload).toBeNull();
    });
  });
});
