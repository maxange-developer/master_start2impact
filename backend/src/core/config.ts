/**
 * Application Configuration Module
 *
 * Centralized settings management loaded from environment variables.
 * Ensures compatibility with existing Python backend configuration.
 *
 * Critical: All values must match Python backend for seamless migration
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config();

/**
 * Settings interface defining all application configuration
 */
interface Settings {
  PROJECT_NAME: string;
  API_V1_STR: string;
  SECRET_KEY: string;
  ALGORITHM: string;
  ACCESS_TOKEN_EXPIRE_MINUTES: number;
  SQLALCHEMY_DATABASE_URI: string;
  OPENAI_API_KEY: string;
  TAVILY_API_KEY: string;
  CORS_ORIGINS: string[];
  PORT: number;
}

/**
 * Singleton settings object
 * Loaded once at application startup
 */
export const settings: Settings = {
  PROJECT_NAME: process.env.PROJECT_NAME || "Tenerife AI Activity Finder",
  API_V1_STR: "/api/v1",
  SECRET_KEY:
    process.env.SECRET_KEY ||
    "aejUOWY7qptc4x2l-Es%ZQo1@CLyfPJ#36F5M*SRTGKwN0BV9+zu8nimX!bk=D&$",
  ALGORITHM: process.env.ALGORITHM || "HS256",
  ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "30"
  ),
  SQLALCHEMY_DATABASE_URI:
    process.env.SQLALCHEMY_DATABASE_URI || "sqlite:///./sql_app.db",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || "",
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(",") || ["*"],
  PORT: parseInt(process.env.PORT || "8000"),
};
