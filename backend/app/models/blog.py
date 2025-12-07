"""
Blog Models Module

SQLAlchemy ORM models for blog article management and user interactions.

This module defines two core models:
- Article: Blog posts with AI-structured content
- SavedArticle: User bookmarks for articles

Key Features:
- AI-powered content structuring (structured_content JSON field)
- Multi-image support via JSON array
- SEO-friendly slug URLs
- Category-based organization
- Publication status control

Database Tables: articles, saved_articles
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Article(Base):
    """
    Blog article model with AI-powered content structuring.
    
    Supports rich content management with automatic section organization,
    multiple images, and SEO-optimized URLs.
    
    Attributes:
        id (int): Unique article identifier (primary key)
        title (str): Article headline (indexed for search)
        slug (str): URL-friendly identifier (unique, e.g., "tenerife-beaches")
        content (Text): Full article body (plain text or markdown)
        excerpt (str): Brief summary for listings (max 500 chars)
        category (str): Article classification (max 50 chars, indexed)
        image_url (str): DEPRECATED - Legacy single image URL
        image_slug (str): DEPRECATED - Legacy image identifier
        images (JSON): Array of image paths ["blog/img1.jpg", "blog/img2.jpg"]
        structured_content (JSON): AI-generated content sections with headers
        author_id (int): Article creator's user ID (nullable)
        is_published (bool): Publication status (default: False)
        created_at (DateTime): Article creation timestamp (UTC)
        
    Database Configuration:
        - Unique constraint on slug for SEO URLs
        - Indexes on id, title, slug, category for performance
        - JSON fields for flexible content storage
        
    Technical Notes:
        - structured_content format: {"sections": [{"title": "...", "content": "..."}]}
        - images field supports multiple image paths
        - Foreign key constraints removed for SQLite compatibility
        - Default unpublished status requires explicit publication
    """
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    content = Column(Text)
    excerpt = Column(String(500))  # Breve riassunto per liste
    category = Column(String(50), index=True)  # Categoria dell'articolo
    image_url = Column(String)  # URL completo immagine (opzionale) - deprecato, usare images
    image_slug = Column(String)  # slug per mappare l'immagine, es. 'teide' - deprecato, usare images
    images = Column(JSON, nullable=True)  # Array di path immagini, es. ['blog/teide-1.jpg', 'blog/teide-2.jpg']
    structured_content = Column(JSON, nullable=True)  # Struttura intelligente generata da AI
    author_id = Column(Integer, nullable=True)  # Author of the article (FK removed for compatibility)
    is_published = Column(Boolean, default=False)  # Published status
    created_at = Column(DateTime, default=datetime.utcnow)

class SavedArticle(Base):
    """
    User bookmark relationship for saved/favorited articles.
    
    Junction table implementing many-to-many relationship between
    users and articles for bookmark functionality.
    
    Attributes:
        id (int): Unique bookmark record identifier (primary key)
        user_id (int): User who saved the article
        article_id (int): Article that was saved
        
    Database Configuration:
        - Composite uniqueness enforced in application layer
        - Foreign key constraints removed for SQLite compatibility
        - Indexes recommended on user_id and article_id for queries
        
    Usage:
        - Query user's saved articles: filter by user_id
        - Count saves for article: count records by article_id
        - Check if user saved article: query both user_id and article_id
        
    Technical Notes:
        - No explicit timestamp (can be added if needed)
        - Deletion cascades handled in application layer
        - Supports quick bookmark/unbookmark operations
    """
    __tablename__ = "saved_articles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)  # FK removed for compatibility
    article_id = Column(Integer)  # FK removed for compatibility
