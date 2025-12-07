"""
Script to import database data from JSON format
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.user import User
from app.models.blog import Article, SavedArticle

def import_data():
    """Import all database data from JSON"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    session = Session(engine)
    
    # Load JSON data
    with open('initial_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Import users
    for user_data in data.get("users", []):
        # Check if user already exists
        existing = session.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                id=user_data["id"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=user_data["hashed_password"],
                is_active=user_data["is_active"],
                is_admin=user_data["is_admin"],
                language=user_data.get("language", "it")
            )
            session.add(user)
    
    # Import articles
    for article_data in data.get("articles", []):
        # Check if article already exists
        existing = session.query(Article).filter(Article.slug == article_data["slug"]).first()
        if not existing:
            article = Article(
                id=article_data["id"],
                title=article_data["title"],
                slug=article_data["slug"],
                content=article_data["content"],
                excerpt=article_data.get("excerpt"),
                category=article_data.get("category"),
                image_url=article_data.get("image_url"),
                image_slug=article_data.get("image_slug"),
                images=article_data.get("images"),
                structured_content=article_data.get("structured_content"),
                author_id=article_data.get("author_id"),
                is_published=article_data.get("is_published", False),
                created_at=datetime.fromisoformat(article_data["created_at"]) if article_data.get("created_at") else datetime.utcnow()
            )
            session.add(article)
    
    # Import saved articles
    for saved_data in data.get("saved_articles", []):
        # Check if already exists
        existing = session.query(SavedArticle).filter(
            SavedArticle.user_id == saved_data["user_id"],
            SavedArticle.article_id == saved_data["article_id"]
        ).first()
        if not existing:
            saved = SavedArticle(
                id=saved_data["id"],
                user_id=saved_data["user_id"],
                article_id=saved_data["article_id"]
            )
            session.add(saved)
    
    session.commit()
    session.close()
    
    print(f"Imported {len(data.get('users', []))} users, {len(data.get('articles', []))} articles, {len(data.get('saved_articles', []))} saved articles")

if __name__ == "__main__":
    import_data()
