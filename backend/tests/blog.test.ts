import request from "supertest";
import express from "express";
import blogRouter from "../src/api/endpoints/blog";
import authRouter from "../src/api/endpoints/auth";
import { initDatabase } from "../src/core/database";
import { sequelize } from "../src/core/database";
import { User } from "../src/models/user";
import { Article } from "../src/models/blog";
import { SavedArticle } from "../src/models/blog";
import { hashPassword } from "../src/core/security";

const app = express();
app.use(express.json());
app.use("/api/v1", authRouter);
app.use("/api/v1/blog", blogRouter);

describe("Blog Endpoints", () => {
  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    await SavedArticle.destroy({ where: {}, force: true });
    await Article.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create admin user directly with hashed password
    const hashedAdminPassword = await hashPassword("admin123");
    adminUser = await User.create({
      email: "admin@example.com",
      hashed_password: hashedAdminPassword,
      full_name: "Admin User",
      is_admin: true,
      language: "en",
    });

    const adminLogin = await request(app).post("/api/v1/login").send({
      username: "admin@example.com",
      password: "admin123",
    });
    adminToken = adminLogin.body.access_token;

    // Create regular user directly
    const hashedUserPassword = await hashPassword("user123");
    regularUser = await User.create({
      email: "user@example.com",
      hashed_password: hashedUserPassword,
      full_name: "Regular User",
      language: "en",
    });

    const userLogin = await request(app).post("/api/v1/login").send({
      username: "user@example.com",
      password: "user123",
    });
    userToken = userLogin.body.access_token;
  });

  describe("GET /api/v1/blog/articles", () => {
    it("should return paginated articles", async () => {
      // Create some articles
      for (let i = 1; i <= 3; i++) {
        await Article.create({
          title: `Article ${i}`,
          slug: `article-${i}`,
          content: `Content ${i}`,
          excerpt: `Excerpt ${i}`,
          author_id: adminUser.id,
          language: "en",
          category: "activities",
        });
      }

      const response = await request(app).get("/api/v1/blog/articles");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should filter articles by language", async () => {
      await Article.create({
        title: "English Article",
        slug: "english-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      await Article.create({
        title: "Spanish Article",
        slug: "spanish-article",
        content: "Contenido",
        excerpt: "Resumen",
        author_id: adminUser.id,
        language: "es",
        category: "activities",
      });

      const response = await request(app).get(
        "/api/v1/blog/articles?language=en",
      );

      expect(response.status).toBe(200);
      expect(response.body.every((a: any) => a.language === "en")).toBe(true);
    });

    it("should filter articles by category", async () => {
      await Article.create({
        title: "Activity Article",
        slug: "activity-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      await Article.create({
        title: "Restaurant Article",
        slug: "restaurant-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "restaurants",
      });

      const response = await request(app).get(
        "/api/v1/blog/articles?category=activities",
      );

      expect(response.status).toBe(200);
      expect(response.body.every((a: any) => a.category === "activities")).toBe(
        true,
      );
    });

    it("should search articles by keyword", async () => {
      await Article.create({
        title: "Beach Activities",
        slug: "beach-activities",
        content: "Beach content",
        excerpt: "Beach excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      await Article.create({
        title: "Mountain Hiking",
        slug: "mountain-hiking",
        content: "Mountain content",
        excerpt: "Mountain excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app).get(
        "/api/v1/blog/articles?search=Beach",
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some((a: any) => a.title.includes("Beach"))).toBe(
        true,
      );
    });
  });

  describe("GET /api/v1/blog/articles/:id", () => {
    it("should return article by id", async () => {
      const article = await Article.create({
        title: "Test Article",
        slug: "test-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app).get(
        `/api/v1/blog/articles/${article.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.slug).toBe("test-article");
      expect(response.body.title).toBe("Test Article");
    });

    it("should return 404 for non-existent id", async () => {
      const response = await request(app).get("/api/v1/blog/articles/99999");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/v1/blog/articles", () => {
    it("should create article as admin", async () => {
      const response = await request(app)
        .post("/api/v1/blog/articles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "New Article",
          content: "Article content",
          excerpt: "Article excerpt",
          language: "en",
          category: "activities",
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("New Article");
      expect(response.body.slug).toBe("new-article");
    });

    it("should reject article creation by non-admin", async () => {
      const response = await request(app)
        .post("/api/v1/blog/articles")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "New Article",
          content: "Content",
          excerpt: "Excerpt",
          language: "en",
          category: "activities",
        });

      expect(response.status).toBe(403);
    });

    it("should reject article without authentication", async () => {
      const response = await request(app).post("/api/v1/blog/articles").send({
        title: "New Article",
        content: "Content",
        excerpt: "Excerpt",
        language: "en",
        category: "activities",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/v1/blog/articles/:id", () => {
    it("should update article as admin", async () => {
      const article = await Article.create({
        title: "Original Title",
        slug: "original-title",
        content: "Original content",
        excerpt: "Original excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app)
        .put(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Updated Title",
          content: "Updated content",
          excerpt: "Updated excerpt",
          language: "en",
          category: "restaurants",
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Title");
      expect(response.body.category).toBe("restaurants");
    });

    it("should reject update by non-admin", async () => {
      const article = await Article.create({
        title: "Article",
        slug: "article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app)
        .put(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Updated Title",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/blog/articles/:id", () => {
    it("should delete article as admin", async () => {
      const article = await Article.create({
        title: "To Delete",
        slug: "to-delete",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Article.findByPk(article.id);
      expect(deleted).toBeNull();
    });

    it("should reject delete by non-admin", async () => {
      const article = await Article.create({
        title: "Article",
        slug: "article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/v1/blog/categories", () => {
    it("should return available categories", async () => {
      // Create articles with different categories
      await Article.create({
        title: "Activity Article",
        slug: "activity-article",
        content: "Activity content",
        excerpt: "Activity excerpt",
        author_id: adminUser.id,
        category: "activities",
        language: "es",
      });

      await Article.create({
        title: "Restaurant Article",
        slug: "restaurant-article",
        content: "Restaurant content",
        excerpt: "Restaurant excerpt",
        author_id: adminUser.id,
        category: "restaurants",
        language: "es",
      });

      const response = await request(app).get("/api/v1/blog/categories");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body).toContain("activities");
      expect(response.body).toContain("restaurants");
    });
  });

  describe("Saved Articles", () => {
    it("should save article", async () => {
      const article = await Article.create({
        title: "Article to Save",
        slug: "save-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app)
        .post(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(201);
    });

    it("should get saved articles", async () => {
      const article = await Article.create({
        title: "Saved Article",
        slug: "saved-article-test",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      await request(app)
        .post(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      const response = await request(app)
        .get("/api/v1/blog/saved")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should unsave article", async () => {
      const article = await Article.create({
        title: "Article",
        slug: "article-unsave",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      await request(app)
        .post(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("removed");
    });

    it("should require authentication for saved articles", async () => {
      const response = await request(app).get("/api/v1/blog/saved");

      expect(response.status).toBe(401);
    });

    it("should return 404 when unsaving non-saved article", async () => {
      const article = await Article.create({
        title: "Not Saved Article",
        slug: "not-saved-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        category: "activities",
      });

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when saving non-existent article", async () => {
      const response = await request(app)
        .post("/api/v1/blog/articles/99999/save")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/blog/articles - extra coverage", () => {
    it("should filter articles by is_published=true", async () => {
      await Article.create({
        title: "Published Article",
        slug: "published-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        is_published: true,
      });

      await Article.create({
        title: "Draft Article",
        slug: "draft-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
        is_published: false,
      });

      const response = await request(app).get(
        "/api/v1/blog/articles?is_published=true",
      );

      expect(response.status).toBe(200);
      expect(response.body.every((a: any) => a.is_published === true)).toBe(
        true,
      );
    });

    it("should apply skip and limit pagination", async () => {
      for (let i = 1; i <= 5; i++) {
        await Article.create({
          title: `Article ${i}`,
          slug: `article-pag-${i}`,
          content: `Content ${i}`,
          excerpt: `Excerpt ${i}`,
          author_id: adminUser.id,
          language: "en",
        });
      }

      const response = await request(app).get(
        "/api/v1/blog/articles?skip=2&limit=2",
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });
  });

  describe("GET /api/v1/blog/articles/:id - extra coverage", () => {
    it("should return 400 for non-numeric article ID", async () => {
      const response = await request(app).get(
        "/api/v1/blog/articles/not-a-number",
      );

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent article", async () => {
      const response = await request(app).get("/api/v1/blog/articles/99999");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/v1/blog/articles/:id - extra coverage", () => {
    it("should return 404 when updating non-existent article", async () => {
      const response = await request(app)
        .put("/api/v1/blog/articles/99999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Updated" });

      expect(response.status).toBe(404);
    });

    it("should return 403 for non-admin user trying to update", async () => {
      const article = await Article.create({
        title: "Original Title",
        slug: "original-title-protected",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      const response = await request(app)
        .put(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Hacked Title" });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/blog/articles/:id - extra coverage", () => {
    it("should return 404 when deleting non-existent article", async () => {
      const response = await request(app)
        .delete("/api/v1/blog/articles/99999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 403 for non-admin user trying to delete", async () => {
      const article = await Article.create({
        title: "Delete Protected",
        slug: "delete-protected",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/v1/blog/articles - validation coverage", () => {
    it("should return 400 when content field is missing", async () => {
      const response = await request(app)
        .post("/api/v1/blog/articles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Title Only" }); // missing required 'content'

      expect(response.status).toBe(400);
    });

    it("should return 400 for duplicate article title (same slug)", async () => {
      await request(app)
        .post("/api/v1/blog/articles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Duplicate Title", content: "Content", language: "en" });

      const response = await request(app)
        .post("/api/v1/blog/articles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Duplicate Title",
          content: "Content 2",
          language: "en",
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain("already exists");
    });
  });

  describe("PUT /api/v1/blog/articles/:id - validation coverage", () => {
    it("should return 400 for invalid PUT body (bad language length)", async () => {
      const article = await Article.create({
        title: "To Update Validation",
        slug: "to-update-validation",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      const response = await request(app)
        .put(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ language: "x" }); // too short, min(2) required

      expect(response.status).toBe(400);
    });

    it("should update article with structured_content field", async () => {
      const article = await Article.create({
        title: "Structured Content Article",
        slug: "structured-content-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      const response = await request(app)
        .put(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          structured_content: {
            sections: [{ title: "Intro", content: "Welcome" }],
          },
        });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/v1/blog/upload-image", () => {
    it("should return 400 when no file is uploaded", async () => {
      const response = await request(app)
        .post("/api/v1/blog/upload-image")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain("No file");
    });

    it("should upload an image file successfully", async () => {
      const fakeImageBuffer = Buffer.from(
        "GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
      );

      const response = await request(app)
        .post("/api/v1/blog/upload-image")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", fakeImageBuffer, {
          filename: "test.gif",
          contentType: "image/gif",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("image_url");
    });
  });

  describe("POST /api/v1/blog/articles/:id/save - already saved", () => {
    it("should return 400 when article is already saved", async () => {
      const article = await Article.create({
        title: "Save Twice Article",
        slug: "save-twice-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      await request(app)
        .post(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      const response = await request(app)
        .post(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain("already saved");
    });
  });

  describe("Blog error handling (DB failures)", () => {
    it("should return 500 on GET /articles database error", async () => {
      jest
        .spyOn(Article, "findAll")
        .mockRejectedValueOnce(new Error("DB error"));

      const response = await request(app).get("/api/v1/blog/articles");

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on GET /articles/:id database error", async () => {
      jest
        .spyOn(Article, "findByPk")
        .mockRejectedValueOnce(new Error("DB error"));

      const response = await request(app).get("/api/v1/blog/articles/1");

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on POST /articles database error", async () => {
      jest
        .spyOn(Article, "create")
        .mockRejectedValueOnce(new Error("DB error"));

      const response = await request(app)
        .post("/api/v1/blog/articles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Error Article", content: "Content", language: "en" });

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on PUT /articles when save throws", async () => {
      const article = await Article.create({
        title: "Save Error Article",
        slug: "save-error-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      jest
        .spyOn(Article.prototype, "save")
        .mockRejectedValueOnce(new Error("Save error"));

      const response = await request(app)
        .put(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "New Title" });

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on DELETE /articles when destroy throws", async () => {
      const article = await Article.create({
        title: "Destroy Error Article",
        slug: "destroy-error-article",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      jest
        .spyOn(Article.prototype, "destroy")
        .mockRejectedValueOnce(new Error("Destroy error"));

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on save article when SavedArticle.create throws", async () => {
      const article = await Article.create({
        title: "Save Create Error",
        slug: "save-create-error",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      jest
        .spyOn(SavedArticle, "create")
        .mockRejectedValueOnce(new Error("Create error"));

      const response = await request(app)
        .post(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on unsave when SavedArticle.destroy throws", async () => {
      const article = await Article.create({
        title: "Unsave Destroy Error",
        slug: "unsave-destroy-error",
        content: "Content",
        excerpt: "Excerpt",
        author_id: adminUser.id,
        language: "en",
      });

      jest
        .spyOn(SavedArticle, "destroy")
        .mockRejectedValueOnce(new Error("Destroy error"));

      const response = await request(app)
        .delete(`/api/v1/blog/articles/${article.id}/save`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on GET /saved when SavedArticle.findAll throws", async () => {
      jest
        .spyOn(SavedArticle, "findAll")
        .mockRejectedValueOnce(new Error("FindAll error"));

      const response = await request(app)
        .get("/api/v1/blog/saved")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should return 500 on GET /categories when query throws", async () => {
      jest
        .spyOn(sequelize, "query")
        .mockRejectedValueOnce(new Error("Query error"));

      const response = await request(app).get("/api/v1/blog/categories");

      expect(response.status).toBe(500);
      jest.restoreAllMocks();
    });

    it("should reject non-image file upload (fileFilter cb with error)", async () => {
      const response = await request(app)
        .post("/api/v1/blog/upload-image")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from("not an image"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
