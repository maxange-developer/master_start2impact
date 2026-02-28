/**
 * Blog Models Module
 *
 * Article and SavedArticle models matching Python backend structure.
 *
 * Database Tables:
 * - articles: Blog posts with AI-structured content
 * - saved_articles: User bookmarks junction table
 */

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../core/database";

/**
 * Article attributes interface
 * Matches Python Article model exactly
 */
interface ArticleAttributes {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  language: string;
  image_url: string | null;
  image_slug: string | null;
  images: string[] | null;
  structured_content: any | null;
  author_id: number | null;
  is_published: boolean;
  created_at: Date;
}

interface ArticleCreationAttributes
  extends Optional<
    ArticleAttributes,
    | "id"
    | "excerpt"
    | "category"
    | "image_url"
    | "image_slug"
    | "images"
    | "structured_content"
    | "author_id"
    | "is_published"
    | "created_at"
  > {}

/**
 * Article model class
 */
export class Article
  extends Model<ArticleAttributes, ArticleCreationAttributes>
  implements ArticleAttributes
{
  public id!: number;
  public title!: string;
  public slug!: string;
  public content!: string;
  public excerpt!: string | null;
  public category!: string | null;
  public language!: string;
  public image_url!: string | null;
  public image_slug!: string | null;
  public images!: string[] | null;
  public structured_content!: any | null;
  public author_id!: number | null;
  public is_published!: boolean;
  public created_at!: Date;
}

/**
 * Initialize Article model
 */
Article.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "es",
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image_slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    structured_content: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "articles",
    timestamps: false,
  }
);

/**
 * SavedArticle model for user bookmarks
 */
interface SavedArticleAttributes {
  id: number;
  user_id: number;
  article_id: number;
}

interface SavedArticleCreationAttributes
  extends Optional<SavedArticleAttributes, "id"> {}

export class SavedArticle
  extends Model<SavedArticleAttributes, SavedArticleCreationAttributes>
  implements SavedArticleAttributes
{
  public id!: number;
  public user_id!: number;
  public article_id!: number;
}

SavedArticle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "saved_articles",
    timestamps: false,
  }
);
