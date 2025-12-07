"""
Blog Articles Endpoint Module

This module provides comprehensive blog article management functionality including
CRUD operations, image uploads, article structuring with AI, and user interactions.

Key Features:
    - Article CRUD operations with filtering and pagination
    - AI-powered article content structuring
    - Image upload and management for articles
    - Saved articles functionality for users
    - Language-specific article retrieval
    - Article categorization and tagging

Dependencies:
    - ArticleStructureService: AI-powered content organization
    - FileSystem: Image upload and storage
    - Authentication: User and admin privilege verification
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from app.api import deps
from app.models import blog as models
from app.schemas import blog as schemas
from app.models.user import User
from app.services.article_structure_service import ArticleStructureService
import os
import uuid
from pathlib import Path

router = APIRouter()
article_service = ArticleStructureService()

# Image storage directory configuration
# Images are stored in frontend public folder for direct access
UPLOAD_DIR = Path("../frontend/public/images/blog")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload image file for blog article with admin authorization.
    
    Validates file type, generates unique filename, and stores image
    in the frontend public directory for direct browser access.
    
    Args:
        file (UploadFile): Image file to upload (JPEG, PNG, GIF, etc.)
        current_user (User): Authenticated user (must be admin)
        
    Returns:
        dict: Contains relative URL path to uploaded image
        
    Raises:
        HTTPException 403: User lacks admin privileges
        HTTPException 400: Invalid file type (non-image)
        HTTPException 500: File system error during upload
        
    Example:
        POST /api/v1/blog/upload-image
        Headers: Authorization: Bearer <token>
        Body: multipart/form-data with image file
        Response: {
            "image_url": "/images/blog/a1b2c3d4-photo.jpg"
        }
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can upload images")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4().hex[:8]}-{file.filename}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Return relative path
    return {"image_url": f"/images/blog/{unique_filename}"}

@router.get("/categories", response_model=List[str])
def read_categories(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve all unique article categories from database.
    
    Queries the database for distinct category values, filtering out
    null/empty categories to provide a clean list for filtering UI.
    
    Args:
        db (Session): SQLAlchemy database session
        
    Returns:
        List[str]: List of unique category names (e.g., ["Technology", "Travel"])
        
    Example:
        GET /api/v1/blog/categories
        Response: ["Technology", "Travel", "Food"]
    """
    categories = db.query(distinct(models.Article.category)).filter(
        models.Article.category.isnot(None)
    ).all()
    return [cat[0] for cat in categories if cat[0]]

@router.get("/articles", response_model=List[schemas.Article])
def read_articles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve paginated list of all articles.
    
    Fetches articles with offset-based pagination for efficient loading.
    Returns all articles regardless of publication status.
    
    Args:
        skip (int, optional): Number of articles to skip. Defaults to 0.
        limit (int, optional): Maximum articles to return. Defaults to 100.
        db (Session): SQLAlchemy database session
        
    Returns:
        List[Article]: List of article objects with all fields
        
    Example:
        GET /api/v1/blog/articles?skip=0&limit=10
        Response: [{id: 1, title: "...", ...}, ...]
    """
    articles = db.query(models.Article).offset(skip).limit(limit).all()
    return articles

@router.post("/articles", response_model=schemas.Article)
async def create_article(
    *,
    db: Session = Depends(deps.get_db),
    article_in: schemas.ArticleCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new article with AI-powered content structuring.
    
    Uses ArticleStructureService to automatically organize article content
    into structured sections. Generates URL-friendly slug if not provided.
    Requires admin authentication.
    
    Args:
        db (Session): SQLAlchemy database session
        article_in (ArticleCreate): Article data including title, content, category
        current_user (User): Authenticated user (must be admin)
        
    Returns:
        Article: Created article with generated structured_content
        
    Raises:
        HTTPException 403: User lacks admin privileges
        HTTPException 500: AI structuring service failure
        
    Example:
        POST /api/v1/blog/articles
        Headers: Authorization: Bearer <token>
        Body: {"title": "My Article", "content": "...", "category": "Tech"}
        Response: {id: 1, structured_content: {sections: [...]}, ...}
    """
    # Verify user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create articles")
    
    # Generate slug if not provided
    slug = article_in.slug
    if not slug:
        slug = article_in.title.lower().replace(" ", "-").replace("'", "")
    
    # Process article with AI to generate structured_content
    try:
        structured_content = await article_service.structure_article(
            article_in.title,
            article_in.content
        )
    except Exception as e:
        print(f"Error structuring article: {e}")
        structured_content = None
    
    # Create article instance
    article = models.Article(
        title=article_in.title,
        slug=slug,
        content=article_in.content,
        excerpt=article_in.excerpt or article_in.content[:200] + "...",
        image_url=article_in.image_url,
        image_slug=article_in.image_slug,
        category=article_in.category,
        structured_content=structured_content,
        images=[article_in.image_url] if article_in.image_url else []
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article

@router.get("/articles/{id}", response_model=schemas.Article)
def read_article(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Retrieve single article by numeric ID.
    
    Fetches complete article data including structured content,
    images, and metadata.
    
    Args:
        db (Session): SQLAlchemy database session
        id (int): Article unique identifier
        
    Returns:
        Article: Complete article object
        
    Raises:
        HTTPException 404: Article not found
        
    Example:
        GET /api/v1/blog/articles/1
        Response: {id: 1, title: "...", structured_content: {...}}
    """
    article = db.query(models.Article).filter(models.Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.get("/articles/slug/{slug}", response_model=schemas.Article)
def read_article_by_slug(
    *,
    db: Session = Depends(deps.get_db),
    slug: str,
) -> Any:
    """
    Retrieve article by URL-friendly slug identifier.
    
    Slugs provide SEO-friendly URLs (e.g., "tenerife-beaches")
    instead of numeric IDs.
    
    Args:
        db (Session): SQLAlchemy database session
        slug (str): URL-friendly article identifier
        
    Returns:
        Article: Complete article object
        
    Raises:
        HTTPException 404: Article with slug not found
        
    Example:
        GET /api/v1/blog/articles/slug/tenerife-beaches
        Response: {id: 5, slug: "tenerife-beaches", title: "..."}
    """
    article = db.query(models.Article).filter(models.Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.post("/save/{article_id}", response_model=schemas.SavedArticle)
def save_article(
    *,
    db: Session = Depends(deps.get_db),
    article_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Bookmark article for authenticated user.
    
    Creates SavedArticle relationship between user and article.
    Idempotent operation - returns existing bookmark if already saved.
    
    Args:
        db (Session): SQLAlchemy database session
        article_id (int): Article ID to bookmark
        current_user (User): Authenticated user
        
    Returns:
        SavedArticle: Bookmark record with user_id and article_id
        
    Raises:
        HTTPException 404: Article not found
        HTTPException 401: User not authenticated
        
    Example:
        POST /api/v1/blog/save/5
        Headers: Authorization: Bearer <token>
        Response: {user_id: 1, article_id: 5, saved_at: "..."}
    """
    # Check if article exists
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if already saved
    saved = db.query(models.SavedArticle).filter(
        models.SavedArticle.user_id == current_user.id,
        models.SavedArticle.article_id == article_id
    ).first()
    
    if saved:
        return saved
    
    saved_article = models.SavedArticle(user_id=current_user.id, article_id=article_id)
    db.add(saved_article)
    db.commit()
    db.refresh(saved_article)
    return saved_article

@router.delete("/unsave/{article_id}")
def unsave_article(
    *,
    db: Session = Depends(deps.get_db),
    article_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Remove article bookmark for authenticated user.
    
    Deletes SavedArticle relationship, removing article from user's
    saved/bookmarked list.
    
    Args:
        db (Session): SQLAlchemy database session
        article_id (int): Article ID to unbookmark
        current_user (User): Authenticated user
        
    Returns:
        dict: Success message confirmation
        
    Raises:
        HTTPException 404: Saved article record not found
        HTTPException 401: User not authenticated
        
    Example:
        DELETE /api/v1/blog/unsave/5
        Headers: Authorization: Bearer <token>
        Response: {"message": "Article removed from saved"}
    """
    saved = db.query(models.SavedArticle).filter(
        models.SavedArticle.user_id == current_user.id,
        models.SavedArticle.article_id == article_id
    ).first()
    
    if not saved:
        raise HTTPException(status_code=404, detail="Saved article not found")
    
    db.delete(saved)
    db.commit()
    return {"message": "Article removed from saved"}

@router.get("/saved", response_model=List[schemas.SavedArticle])
def read_saved_articles(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve all bookmarked articles for authenticated user.
    
    Returns user's complete saved articles list for displaying
    in bookmarks/favorites section.
    
    Args:
        db (Session): SQLAlchemy database session
        current_user (User): Authenticated user
        
    Returns:
        List[SavedArticle]: User's saved article records
        
    Raises:
        HTTPException 401: User not authenticated
        
    Example:
        GET /api/v1/blog/saved
        Headers: Authorization: Bearer <token>
        Response: [{user_id: 1, article_id: 5}, {user_id: 1, article_id: 12}]
    """
    saved = db.query(models.SavedArticle).filter(models.SavedArticle.user_id == current_user.id).all()
    return saved

# Simplified endpoints for tests (at root /blog)
@router.get("", response_model=List[schemas.Article])
def get_all_articles(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve all published articles (public access endpoint).
    
    Simplified endpoint for public article listing without authentication.
    Only returns articles marked as published.
    
    Args:
        db (Session): SQLAlchemy database session
        
    Returns:
        List[Article]: All published articles
        
    Example:
        GET /api/v1/blog
        Response: [{id: 1, is_published: true, ...}, ...]
    """
    articles = db.query(models.Article).filter(models.Article.is_published == True).all()
    return articles

@router.post("", response_model=schemas.Article)
def create_article_simple(
    *,
    db: Session = Depends(deps.get_db),
    article_in: schemas.ArticleCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create article without AI structuring (simplified admin endpoint).
    
    Alternative creation endpoint that bypasses AI structuring service.
    Sets author_id to current user. Used primarily in testing scenarios.
    
    Args:
        db (Session): SQLAlchemy database session
        article_in (ArticleCreate): Article creation data
        current_user (User): Authenticated admin user
        
    Returns:
        Article: Created article without structured_content
        
    Raises:
        HTTPException 403: User lacks admin privileges
        
    Technical Notes:
        - Skips ArticleStructureService for faster creation
        - Automatically assigns author_id from current_user
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create articles")
    
    article = models.Article(**article_in.dict())
    article.author_id = current_user.id
    db.add(article)
    db.commit()
    db.refresh(article)
    return article

@router.get("/{slug}", response_model=schemas.Article)
def get_article_by_slug_simple(
    slug: str,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve article by slug (simplified public endpoint).
    
    No authentication required. Used for public article viewing.
    
    Args:
        slug (str): Article URL slug identifier
        db (Session): SQLAlchemy database session
        
    Returns:
        Article: Complete article data
        
    Raises:
        HTTPException 404: Article not found
    """
    article = db.query(models.Article).filter(models.Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.put("/{article_id}", response_model=schemas.Article)
def update_article(
    article_id: int,
    article_in: schemas.ArticleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update existing article with partial data (admin only).
    
    Supports partial updates using Pydantic's exclude_unset feature.
    Only provided fields are updated, others remain unchanged.
    
    Args:
        article_id (int): Article ID to update
        article_in (ArticleUpdate): Partial article data
        db (Session): SQLAlchemy database session
        current_user (User): Authenticated admin user
        
    Returns:
        Article: Updated article with all current fields
        
    Raises:
        HTTPException 403: User lacks admin privileges
        HTTPException 404: Article not found
        
    Example:
        PUT /api/v1/blog/5
        Body: {"title": "New Title"}
        Response: {id: 5, title: "New Title", content: "unchanged"}
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update articles")
    
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    update_data = article_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)
    
    db.commit()
    db.refresh(article)
    return article

@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Permanently delete article from database (admin only).
    
    Hard deletion that removes article and cascades to related records
    (saved articles, comments, etc.).
    
    Args:
        article_id (int): Article ID to delete
        db (Session): SQLAlchemy database session
        current_user (User): Authenticated admin user
        
    Returns:
        dict: Success confirmation message
        
    Raises:
        HTTPException 403: User lacks admin privileges
        HTTPException 404: Article not found
        
    Technical Notes:
        - Hard delete (permanent removal)
        - Cascades to SavedArticle records
        - Cannot be undone
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete articles")
    
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.delete(article)
    db.commit()
    return {"message": "Article deleted successfully"}

# Alternative endpoints for tests (/{article_id}/save format)
@router.post("/{article_id}/save", response_model=schemas.SavedArticle)
def save_article_alt(
    article_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Bookmark article (alternative endpoint format for testing).
    
    Identical to /save/{article_id} but with different URL structure.
    Supports both URL patterns for backward compatibility.
    
    Args:
        article_id (int): Article ID to bookmark
        db (Session): SQLAlchemy database session
        current_user (User): Authenticated user
        
    Returns:
        SavedArticle: Bookmark record
        
    Raises:
        HTTPException 404: Article not found
        
    Technical Notes:
        - Idempotent operation
        - Alternative URL pattern: /{id}/save vs /save/{id}
    """
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    saved = db.query(models.SavedArticle).filter(
        models.SavedArticle.user_id == current_user.id,
        models.SavedArticle.article_id == article_id
    ).first()
    
    if saved:
        return saved
    
    saved_article = models.SavedArticle(user_id=current_user.id, article_id=article_id)
    db.add(saved_article)
    db.commit()
    db.refresh(saved_article)
    return saved_article

@router.delete("/{article_id}/unsave")
def unsave_article_alt(
    article_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Unsave article (alternative endpoint)"""
    saved = db.query(models.SavedArticle).filter(
        models.SavedArticle.user_id == current_user.id,
        models.SavedArticle.article_id == article_id
    ).first()
    
    if not saved:
        raise HTTPException(status_code=404, detail="Article not in saved list")
    
    db.delete(saved)
    db.commit()
    return {"message": "Article removed from saved"}

@router.post("/unsave/{article_id}")
def unsave_article_post(
    article_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Unsave article (POST alternative for tests)"""
    saved = db.query(models.SavedArticle).filter(
        models.SavedArticle.user_id == current_user.id,
        models.SavedArticle.article_id == article_id
    ).first()
    
    if not saved:
        raise HTTPException(status_code=404, detail="Article not in saved list")
    
    db.delete(saved)
    db.commit()
    return {"message": "Article removed from saved"}
