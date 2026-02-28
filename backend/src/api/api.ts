/**
 * API Router Configuration Module
 *
 * Central router configuration that aggregates all endpoint modules
 * into a single Express Router with organized prefixes and tags.
 *
 * Architecture:
 *   api_router (Router)
 *   ├── /auth (Authentication endpoints)
 *   ├── /search (AI search endpoints)
 *   └── /blog (Blog management endpoints)
 *
 * Endpoint Groups:
 *   - auth: User registration, login, token management
 *   - search: AI-powered Tenerife activity search
 *   - blog: Article CRUD, image upload, saved articles
 *
 * Technical Notes:
 *   - Imported in index.ts and mounted at /api/v1
 *   - Provides RESTful URL structure
 */

import { Router } from "express";
import authRouter from "./endpoints/auth";
import blogRouter from "./endpoints/blog";
import searchRouter from "./endpoints/search";

const apiRouter = Router();

// Include all endpoint routers
apiRouter.use("/auth", authRouter);
apiRouter.use("/blog", blogRouter);
apiRouter.use("/search", searchRouter);

export default apiRouter;
