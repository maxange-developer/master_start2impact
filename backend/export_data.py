"""
Script to export database data to JSON format
"""
import json
from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User
from app.models.blog import Article, SavedArticle

def export_data():
    """Export all database data to JSON"""
    session = Session(engine)
    
    data = {
        "users": [],
        "articles": [],
        "saved_articles": []
    }
    
    # Export users (without passwords for security)
    users = session.query(User).all()
    for user in users:
        data["users"].append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "hashed_password": user.hashed_password,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "language": user.language
        })
    
    # Export articles
    articles = session.query(Article).all()
    for article in articles:
        data["articles"].append({
            "id": article.id,
            "title": article.title,
            "slug": article.slug,
            "content": article.content,
            "excerpt": article.excerpt,
            "category": article.category,
            "image_url": article.image_url,
            "image_slug": article.image_slug,
            "images": article.images,
            "structured_content": article.structured_content,
            "author_id": article.author_id,
            "is_published": article.is_published,
            "created_at": article.created_at.isoformat() if article.created_at else None
        })
    
    # Export saved articles
    saved = session.query(SavedArticle).all()
    for sa in saved:
        data["saved_articles"].append({
            "id": sa.id,
            "user_id": sa.user_id,
            "article_id": sa.article_id
        })
    
    session.close()
    
    # Write to JSON file
    with open('initial_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(data['users'])} users, {len(data['articles'])} articles, {len(data['saved_articles'])} saved articles")

if __name__ == "__main__":
    export_data()
