"""
Blog Article Pydantic Schemas Module

Request/response validation schemas for blog article management.

This module defines Pydantic models for:
- Article creation and updates with validation
- Article API response serialization
- Saved article bookmark responses
- AI-structured content validation

Schema Hierarchy:
- ArticleBase: Shared article properties
- ArticleCreate: Full article creation request
- ArticleUpdate: Partial article update request
- Article: Complete article API response
- SavedArticle: Bookmark relationship response

Technical Notes:
- Supports both legacy (image_url) and new (images array) image fields
- structured_content validates JSON structure from AI service
- from_attributes (Pydantic v2) replaces orm_mode
- Partial updates via ArticleUpdate.exclude_unset()
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class ArticleBase(BaseModel):
    """
    Base article schema with shared properties.
    
    Defines common fields for article operations. Supports both legacy
    single-image fields and new multi-image array structure.
    
    Attributes:
        title (str): Article headline/title
        slug (str, optional): URL-friendly identifier (auto-generated if None)
        content (str): Full article body (markdown or plain text)
        excerpt (str, optional): Brief summary for listings (auto-generated if None)
        category (str, optional): Article classification (e.g., "Travel", "Technology")
        image_url (str, optional): DEPRECATED - Legacy single image URL
        image_slug (str, optional): DEPRECATED - Legacy image identifier
        images (List[str], optional): Array of image paths ["blog/img1.jpg", ...]
        structured_content (Dict, optional): AI-generated sections with headers
        is_published (bool, optional): Publication status (default: False)
        
    Technical Notes:
        - slug auto-generated from title if not provided
        - excerpt auto-generated from content[:200] if not provided
        - structured_content format: {"sections": [{"title": "...", "content": "..."}]}
    """
    title: str
    slug: Optional[str] = None
    content: str
    excerpt: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    image_slug: Optional[str] = None
    images: Optional[List[str]] = None
    structured_content: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = False

class ArticleCreate(ArticleBase):
    """
    Article creation request schema.
    
    Inherits all ArticleBase fields. Used for POST /articles endpoint.
    AI structuring service processes content after validation.
    
    Example:
        {
            "title": "Tenerife Beaches Guide",
            "content": "Tenerife offers amazing beaches...",
            "category": "Travel",
            "images": ["/images/blog/beach1.jpg"],
            "is_published": false
        }
    """
    pass

class ArticleUpdate(BaseModel):
    """
    Article partial update request schema.
    
    All fields optional to support PATCH-like partial updates.
    Only provided fields are updated in database.
    
    Attributes:
        title (str, optional): Updated headline
        content (str, optional): Updated body text
        excerpt (str, optional): Updated summary
        category (str, optional): Updated classification
        image_url (str, optional): Updated legacy image
        is_published (bool, optional): Updated publication status
        
    Example (partial update):
        {
            "is_published": true
        }
    """
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_published: Optional[bool] = None

class Article(ArticleBase):
    """
    Article API response schema.
    
    Complete article data including database-generated fields.
    Serializes SQLAlchemy Article model for API responses.
    
    Attributes:
        id (int): Unique article identifier (from database)
        author_id (int, optional): Creator's user ID
        created_at (datetime): Article creation timestamp (UTC)
        
    Config:
        from_attributes (bool): Pydantic v2 - enables SQLAlchemy model conversion
        
    Example Response:
        {
            "id": 1,
            "title": "Tenerife Beaches",
            "slug": "tenerife-beaches",
            "content": "...",
            "structured_content": {
                "sections": [
                    {"title": "Introduction", "content": "..."},
                    {"title": "Best Beaches", "content": "..."}
                ]
            },
            "author_id": 5,
            "created_at": "2024-01-15T10:30:00",
            "is_published": true
        }
    """
    id: int
    author_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SavedArticle(BaseModel):
    """
    Saved article bookmark response schema.
    
    Represents user's bookmarked article with nested article data.
    
    Attributes:
        id (int): Bookmark record identifier
        article (Article): Complete nested article object
        
    Config:
        from_attributes (bool): Pydantic v2 - enables SQLAlchemy model conversion
        
    Example Response:
        {
            "id": 42,
            "article": {
                "id": 5,
                "title": "Tenerife Beaches",
                ...
            }
        }
        
    Technical Notes:
        - Nested article object loaded via SQLAlchemy relationship
        - Used in GET /saved endpoint to return full article details
    """
    id: int
    article: Article

    class Config:
        from_attributes = True
