import { settings } from "../src/core/config";

describe("Configuration Module", () => {
  it("should load PORT from environment", () => {
    expect(settings.PORT).toBeDefined();
    expect(typeof settings.PORT).toBe("number");
  });

  it("should load SECRET_KEY from environment", () => {
    expect(settings.SECRET_KEY).toBeDefined();
    expect(typeof settings.SECRET_KEY).toBe("string");
    expect(settings.SECRET_KEY.length).toBeGreaterThan(0);
  });

  it("should load SQLALCHEMY_DATABASE_URI from environment", () => {
    expect(settings.SQLALCHEMY_DATABASE_URI).toBeDefined();
    expect(typeof settings.SQLALCHEMY_DATABASE_URI).toBe("string");
  });

  it("should have default ALGORITHM", () => {
    expect(settings.ALGORITHM).toBeDefined();
    expect(settings.ALGORITHM).toBe("HS256");
  });

  it("should have ACCESS_TOKEN_EXPIRE_MINUTES", () => {
    expect(settings.ACCESS_TOKEN_EXPIRE_MINUTES).toBeDefined();
    expect(typeof settings.ACCESS_TOKEN_EXPIRE_MINUTES).toBe("number");
    expect(settings.ACCESS_TOKEN_EXPIRE_MINUTES).toBeGreaterThan(0);
  });

  it("should load CORS_ORIGINS", () => {
    expect(settings.CORS_ORIGINS).toBeDefined();
    expect(Array.isArray(settings.CORS_ORIGINS)).toBe(true);
  });

  it("should have OPENAI_API_KEY property", () => {
    expect(settings).toHaveProperty("OPENAI_API_KEY");
  });

  it("should have TAVILY_API_KEY property", () => {
    expect(settings).toHaveProperty("TAVILY_API_KEY");
  });

  it("should be a singleton", () => {
    const settings1 = require("../src/core/config").settings;
    const settings2 = require("../src/core/config").settings;

    expect(settings1).toBe(settings2);
  });

  it("should have PROJECT_NAME", () => {
    expect(settings.PROJECT_NAME).toBeDefined();
    expect(typeof settings.PROJECT_NAME).toBe("string");
  });

  it("should use environment variables when they are set", () => {
    // Use jest.isolateModules to load a fresh config with custom env vars
    const originalEnv = { ...process.env };

    process.env.SECRET_KEY = "env-custom-secret-key";
    process.env.ALGORITHM = "RS256";
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES = "60";
    process.env.SQLALCHEMY_DATABASE_URI = "postgresql://localhost/test";
    process.env.TAVILY_API_KEY = "env-tavily-key-123";
    process.env.CORS_ORIGINS = "http://localhost:3000,http://localhost:5173";

    let envSettings: any;
    jest.isolateModules(() => {
      envSettings = require("../src/core/config").settings;
    });

    expect(envSettings.SECRET_KEY).toBe("env-custom-secret-key");
    expect(envSettings.ALGORITHM).toBe("RS256");
    expect(envSettings.ACCESS_TOKEN_EXPIRE_MINUTES).toBe(60);
    expect(envSettings.SQLALCHEMY_DATABASE_URI).toBe(
      "postgresql://localhost/test",
    );
    expect(envSettings.TAVILY_API_KEY).toBe("env-tavily-key-123");
    expect(envSettings.CORS_ORIGINS).toEqual([
      "http://localhost:3000",
      "http://localhost:5173",
    ]);

    // Restore original env
    process.env = originalEnv;
  });
});
