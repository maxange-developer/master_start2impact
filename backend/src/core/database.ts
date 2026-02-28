/**
 * Database Configuration Module
 *
 * Sequelize ORM setup for SQLite database.
 * Must maintain compatibility with existing Python SQLAlchemy models.
 *
 * Tables:
 * - users: User authentication and profile
 * - articles: Blog posts with AI-structured content
 * - saved_articles: User bookmarks junction table
 */

import { Sequelize } from "sequelize";
import { settings } from "./config";

/**
 * Initialize Sequelize instance with SQLite
 * Compatible with Python backend's SQLAlchemy database
 */
export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: settings.SQLALCHEMY_DATABASE_URI.replace("sqlite:///", ""),
  logging: false, // Set to console.log for debugging
  define: {
    timestamps: false, // Python models don't use default timestamps
    freezeTableName: true, // Use exact table names (no pluralization)
  },
});

/**
 * Test database connection
 * Called at application startup
 */
export async function initDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync models (create tables if they don't exist)
    // Use { alter: true } for development, false for production
    await sequelize.sync({ alter: false });
    console.log("✅ Database synchronized");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
    process.exit(1);
  }
}
