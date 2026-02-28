/**
 * Express Application Entry Point
 *
 * Initializes Express app with:
 * - CORS middleware
 * - Body parsers
 * - API routes
 * - Error handling
 * - Database connection
 *
 * CRITICAL: Must listen on port 8000 to match frontend API calls
 */

import express from "express";
import cors from "cors";
import { settings } from "./core/config";
import { initDatabase } from "./core/database";
import { errorHandler } from "./middlewares/errorHandler";
import apiRouter from "./api/api";

const app = express();

/**
 * CORS Configuration
 * Must allow frontend origin (http://localhost:5173)
 */
app.use(
  cors({
    origin: settings.CORS_ORIGINS,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * Body parsers
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Root endpoint
 */
app.get("/", (req, res) => {
  res.json({
    message: "Tenerife AI Activity Finder API",
    version: "1.0.0",
    status: "running",
    api_endpoint: `${settings.API_V1_STR}`,
  });
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * API Routes (CRITICAL: Must use /api/v1 prefix)
 */
app.use(`${settings.API_V1_STR}`, apiRouter);

/**
 * Error handling middleware (must be last)
 */
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Start listening
    app.listen(settings.PORT, () => {
      console.log("🚀 ========================================");
      console.log(`✅ Server running on http://localhost:${settings.PORT}`);
      console.log(
        `✅ API endpoint: http://localhost:${settings.PORT}${settings.API_V1_STR}`
      );
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("🚀 ========================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start server if not in test mode
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app; // Export for testing
