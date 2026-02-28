/**
 * Blog Endpoints Module
 *
 * Complete blog management with all CRUD operations
 * Must match Python backend API exactly for frontend compatibility
 *
 * Endpoints:
 * - GET /api/v1/blog/articles - List articles with filters
 * - GET /api/v1/blog/articles/:id - Get single article
 * - POST /api/v1/blog/articles - Create article (admin only)
 * - PUT /api/v1/blog/articles/:id - Update article (admin only)
 * - DELETE /api/v1/blog/articles/:id - Delete article (admin only)
 * - POST /api/v1/blog/upload-image - Upload image (admin only)
 * - POST /api/v1/blog/articles/:id/save - Save/bookmark article
 * - DELETE /api/v1/blog/articles/:id/save - Remove bookmark
 * - GET /api/v1/blog/saved - Get user's saved articles
 * - GET /api/v1/blog/categories - Get unique categories
 */

import { Router, Response } from "express";
import { Op } from "sequelize";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { Article, SavedArticle } from "../../models/blog";
import { getCurrentUser, requireAdmin, AuthRequest } from "../deps";
import { sequelize } from "../../core/database";
import { ArticleCreateSchema, ArticleUpdateSchema } from "../../schemas/blog";

const router = Router();

// Configure multer for image uploads
// Images must be stored in frontend public folder for direct access
const uploadDir = path.join(
  __dirname,
  "../../../../frontend/public/images/blog"
);

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * GET /api/v1/blog/articles
 * Query params: skip, limit, category, is_published, language
 * Returns: Array of articles
 */
router.get("/articles", async (req, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 100;
    const category = req.query.category as string;
    const language = req.query.language as string;
    const isPublished = req.query.is_published;

    const where: any = {};
    if (category) where.category = category;
    if (language) where.language = language;
    if (isPublished !== undefined) where.is_published = isPublished === "true";

    const articles = await Article.findAll({
      where,
      offset: skip,
      limit,
      order: [["created_at", "DESC"]],
    });

    return res.json(articles);
  } catch (error) {
    console.error("❌ Get articles error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

/**
 * GET /api/v1/blog/articles/:id
 * Returns: Single article object
 */
router.get("/articles/:id", async (req, res: Response) => {
  try {
    const articleId = parseInt(req.params.id);

    if (isNaN(articleId)) {
      return res.status(400).json({ detail: "Invalid article ID" });
    }

    const article = await Article.findByPk(articleId);

    if (!article) {
      return res.status(404).json({ detail: "Article not found" });
    }

    return res.json(article);
  } catch (error) {
    console.error("❌ Get article error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

/**
 * POST /api/v1/blog/articles (Admin only)
 * Body: { title, content, excerpt?, category?, images?, is_published? }
 * Returns: Created article object
 */
router.post(
  "/articles",
  getCurrentUser,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate request body
      const parsed = ArticleCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ detail: "Invalid input", errors: parsed.error.errors });
      }

      const {
        title,
        content,
        excerpt,
        category,
        language,
        images,
        structured_content,
        is_published,
      } = parsed.data;

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if slug already exists
      const existingArticle = await Article.findOne({ where: { slug } });
      if (existingArticle) {
        return res
          .status(400)
          .json({ detail: "Article with this title already exists" });
      }

      const article = await Article.create({
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        category: category || null,
        language: language || "es",
        images: images || [],
        structured_content: structured_content || null,
        is_published: is_published || false,
        author_id: req.user!.id,
        created_at: new Date(),
      });

      return res.status(201).json(article);
    } catch (error) {
      console.error("❌ Create article error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * PUT /api/v1/blog/articles/:id (Admin only)
 * Body: { title?, content?, excerpt?, category?, images?, is_published? }
 * Returns: Updated article object
 */
router.put(
  "/articles/:id",
  getCurrentUser,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);

      const article = await Article.findByPk(articleId);
      if (!article) {
        return res.status(404).json({ detail: "Article not found" });
      }

      // Validate request body
      const parsed = ArticleUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ detail: "Invalid input", errors: parsed.error.errors });
      }

      const {
        title,
        content,
        excerpt,
        category,
        language,
        images,
        structured_content,
        is_published,
      } = parsed.data;

      // Update fields if provided
      if (title) {
        article.title = title;
        article.slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      if (content !== undefined) article.content = content;
      if (excerpt !== undefined) article.excerpt = excerpt;
      if (category !== undefined) article.category = category;
      if (language !== undefined) article.language = language;
      if (images !== undefined) article.images = images;
      if (structured_content !== undefined)
        article.structured_content = structured_content;
      if (is_published !== undefined) article.is_published = is_published;

      await article.save();

      return res.json(article);
    } catch (error) {
      console.error("❌ Update article error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/v1/blog/articles/:id (Admin only)
 * Returns: Success message
 */
router.delete(
  "/articles/:id",
  getCurrentUser,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);

      const article = await Article.findByPk(articleId);
      if (!article) {
        return res.status(404).json({ detail: "Article not found" });
      }

      // Delete associated saved articles
      await SavedArticle.destroy({ where: { article_id: articleId } });

      await article.destroy();

      return res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("❌ Delete article error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * POST /api/v1/blog/upload-image (Admin only)
 * Form Data: file (multipart/form-data)
 * Returns: { image_url: string }
 */
router.post(
  "/upload-image",
  getCurrentUser,
  requireAdmin,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ detail: "No file uploaded" });
      }

      const imageUrl = `/images/blog/${req.file.filename}`;
      return res.json({ image_url: imageUrl });
    } catch (error) {
      console.error("❌ Upload image error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * POST /api/v1/blog/articles/:id/save
 * Bookmark an article for current user
 * Returns: Success message
 */
router.post(
  "/articles/:id/save",
  getCurrentUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if article exists
      const article = await Article.findByPk(articleId);
      if (!article) {
        return res.status(404).json({ detail: "Article not found" });
      }

      // Check if already saved
      const existing = await SavedArticle.findOne({
        where: { user_id: userId, article_id: articleId },
      });

      if (existing) {
        return res.status(400).json({ detail: "Article already saved" });
      }

      await SavedArticle.create({
        user_id: userId,
        article_id: articleId,
      });

      return res.status(201).json({ message: "Article saved successfully" });
    } catch (error) {
      console.error("❌ Save article error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/v1/blog/articles/:id/save
 * Remove bookmark for current user
 * Returns: Success message
 */
router.delete(
  "/articles/:id/save",
  getCurrentUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.user!.id;

      const deleted = await SavedArticle.destroy({
        where: { user_id: userId, article_id: articleId },
      });

      if (deleted === 0) {
        return res.status(404).json({ detail: "Saved article not found" });
      }

      return res.json({ message: "Article removed from saved" });
    } catch (error) {
      console.error("❌ Remove saved article error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * GET /api/v1/blog/saved
 * Get all saved articles for current user
 * Returns: Array of saved articles with full article data
 */
router.get(
  "/saved",
  getCurrentUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const savedArticles = await SavedArticle.findAll({
        where: { user_id: userId },
      });

      // Manually fetch articles for each saved article
      const articlesWithData = await Promise.all(
        savedArticles.map(async (saved) => {
          const article = await Article.findByPk(saved.article_id);
          return {
            id: saved.id,
            user_id: saved.user_id,
            article_id: saved.article_id,
            article: article,
          };
        })
      );

      return res.json(articlesWithData);
    } catch (error) {
      console.error("❌ Get saved articles error:", error);
      return res.status(500).json({ detail: "Internal server error" });
    }
  }
);

/**
 * GET /api/v1/blog/categories
 * Get list of all unique categories
 * Returns: Array of category strings
 */
router.get("/categories", async (req, res: Response) => {
  try {
    const { QueryTypes } = await import("sequelize");
    const result = (await sequelize.query(
      "SELECT DISTINCT category FROM articles WHERE category IS NOT NULL",
      { type: QueryTypes.SELECT }
    )) as any[];

    const categories = result.map((row: any) => row.category);
    return res.json(categories);
  } catch (error) {
    console.error("❌ Get categories error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
