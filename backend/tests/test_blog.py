"""Tests for blog endpoints"""
import pytest
from app.models.blog import Article

# API prefix
API_PREFIX = "/api/v1"


def test_get_all_articles_public(client):
    """Test get all published articles (public access)"""
    response = client.get(f"{API_PREFIX}/blog")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_article_admin(client, admin_headers, admin_user):
    """Test create article as admin"""
    response = client.post(
        f"{API_PREFIX}/blog",
        headers=admin_headers,
        json={
            "title": "Test Article",
            "content": "This is test content for the article.",
            "excerpt": "Test excerpt",
            "slug": "test-article",
            "image_url": "https://example.com/image.jpg",
            "is_published": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Article"
    assert data["slug"] == "test-article"
    assert data["is_published"] == True
    assert "id" in data
    assert "created_at" in data


def test_create_article_non_admin(client, auth_headers):
    """Test create article as non-admin user (should fail)"""
    response = client.post(
        f"{API_PREFIX}/blog",
        headers=auth_headers,
        json={
            "title": "Test Article",
            "content": "Test content",
            "excerpt": "Test excerpt",
            "slug": "test-article"
        }
    )
    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()


def test_create_article_no_auth(client):
    """Test create article without authentication"""
    response = client.post(
        f"{API_PREFIX}/blog",
        json={
            "title": "Test Article",
            "content": "Test content"
        }
    )
    assert response.status_code == 401


def test_get_article_by_slug(client, admin_headers, admin_user, db):
    """Test get article by slug"""
    # Create article first
    article = Article(
        title="Test Article",
        content="Test content",
        excerpt="Test excerpt",
        slug="test-article",
        author_id=admin_user.id,
        is_published=True,
        image_url="https://example.com/image.jpg"
    )
    db.add(article)
    db.commit()
    
    response = client.get(f"{API_PREFIX}/blog/test-article")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-article"
    assert data["title"] == "Test Article"


def test_get_article_nonexistent(client):
    """Test get non-existent article"""
    response = client.get(f"{API_PREFIX}/blog/nonexistent-article")
    assert response.status_code == 404


def test_save_article(client, auth_headers, admin_user, db, test_user):
    """Test save article to user's saved list"""
    # Create article first
    article = Article(
        title="Test Article",
        content="Content",
        excerpt="Excerpt",
        slug="test",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.post(
        f"{API_PREFIX}/blog/{article.id}/save",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "article_id" in data or "article" in data


def test_save_article_no_auth(client, admin_user, db):
    """Test save article without authentication"""
    article = Article(
        title="Test Article",
        content="Content",
        excerpt="Excerpt",
        slug="test",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.post(f"{API_PREFIX}/blog/{article.id}/save")
    assert response.status_code == 401


def test_unsave_article(client, auth_headers, admin_user, db, test_user):
    """Test unsave article from user's saved list"""
    # Create and save article first
    article = Article(
        title="Test Article",
        content="Content",
        excerpt="Excerpt",
        slug="test",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    # Save it
    client.post(f"{API_PREFIX}/blog/{article.id}/save", headers=auth_headers)
    
    # Now unsave it
    response = client.post(
        f"{API_PREFIX}/blog/unsave/{article.id}",
        headers=auth_headers
    )
    assert response.status_code == 200


def test_get_saved_articles(client, auth_headers):
    """Test get user's saved articles"""
    response = client.get(f"{API_PREFIX}/blog/saved", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_saved_articles_no_auth(client):
    """Test get saved articles without authentication"""
    response = client.get(f"{API_PREFIX}/blog/saved")
    assert response.status_code == 401


def test_update_article_admin(client, admin_headers, admin_user, db):
    """Test update article as admin"""
    # Create article
    article = Article(
        title="Original Title",
        content="Original content",
        excerpt="Original excerpt",
        slug="original-slug",
        author_id=admin_user.id,
        is_published=False
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    # Update it
    response = client.put(
        f"{API_PREFIX}/blog/{article.id}",
        headers=admin_headers,
        json={
            "title": "Updated Title",
            "content": "Updated content",
            "excerpt": "Updated excerpt",
            "slug": "updated-slug",
            "is_published": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["is_published"] == True


def test_delete_article_admin(client, admin_headers, admin_user, db):
    """Test delete article as admin"""
    # Create article
    article = Article(
        title="To Delete",
        content="Content",
        excerpt="Excerpt",
        slug="to-delete",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    # Delete it
    response = client.delete(
        f"{API_PREFIX}/blog/{article.id}",
        headers=admin_headers
    )
    assert response.status_code == 200


def test_delete_article_non_admin(client, auth_headers, admin_user, db):
    """Test delete article as non-admin (should fail)"""
    article = Article(
        title="To Delete",
        content="Content",
        excerpt="Excerpt",
        slug="to-delete",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.delete(
        f"{API_PREFIX}/blog/{article.id}",
        headers=auth_headers
    )
    assert response.status_code == 403


def test_only_published_articles_public(client, admin_user, db):
    """Test that only published articles are returned to public"""
    # Create published article
    published = Article(
        title="Published",
        content="Content",
        excerpt="Excerpt",
        slug="published",
        author_id=admin_user.id,
        is_published=True
    )
    # Create unpublished article
    unpublished = Article(
        title="Draft",
        content="Content",
        excerpt="Excerpt",
        slug="draft",
        author_id=admin_user.id,
        is_published=False
    )
    db.add(published)
    db.add(unpublished)
    db.commit()
    
    response = client.get(f"{API_PREFIX}/blog")
    assert response.status_code == 200
    articles = response.json()
    
    # Should only get published article
    slugs = [a["slug"] for a in articles]
    assert "published" in slugs
    assert "draft" not in slugs


def test_get_categories(client, admin_user, db):
    """Test get all unique categories"""
    # Create articles with different categories
    articles_data = [
        ("Article 1", "natura", "slug1"),
        ("Article 2", "mare", "slug2"),
        ("Article 3", "natura", "slug3"),
        ("Article 4", None, "slug4"),  # No category
    ]
    
    for title, category, slug in articles_data:
        article = Article(
            title=title,
            content="Content",
            excerpt="Excerpt",
            slug=slug,
            category=category,
            author_id=admin_user.id,
            is_published=True
        )
        db.add(article)
    db.commit()
    
    response = client.get(f"{API_PREFIX}/blog/categories")
    assert response.status_code == 200
    categories = response.json()
    
    # Should have 2 unique categories (natura, mare)
    assert len(categories) == 2
    assert "natura" in categories
    assert "mare" in categories


def test_get_articles_with_pagination(client, admin_user, db):
    """Test get articles with skip/limit pagination"""
    # Create 5 articles
    for i in range(5):
        article = Article(
            title=f"Article {i}",
            content="Content",
            excerpt="Excerpt",
            slug=f"slug-{i}",
            author_id=admin_user.id,
            is_published=True
        )
        db.add(article)
    db.commit()
    
    # Get first 2
    response = client.get(f"{API_PREFIX}/blog/articles?skip=0&limit=2")
    assert response.status_code == 200
    articles = response.json()
    assert len(articles) == 2
    
    # Get next 2
    response = client.get(f"{API_PREFIX}/blog/articles?skip=2&limit=2")
    assert response.status_code == 200
    articles = response.json()
    assert len(articles) == 2


def test_get_article_by_id(client, admin_user, db):
    """Test get article by ID"""
    article = Article(
        title="Test Article",
        content="Content",
        excerpt="Excerpt",
        slug="test-slug",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.get(f"{API_PREFIX}/blog/articles/{article.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Article"
    assert data["id"] == article.id


def test_get_article_by_id_not_found(client):
    """Test get article by non-existent ID"""
    response = client.get(f"{API_PREFIX}/blog/articles/99999")
    assert response.status_code == 404


def test_create_article_with_ai_structure(client, admin_headers, admin_user, db):
    """Test create article with AI-generated structure"""
    response = client.post(
        f"{API_PREFIX}/blog/articles",
        headers=admin_headers,
        json={
            "title": "AI Structured Article",
            "content": "This is a test article.\n\nWith multiple paragraphs.\n\nAnd a conclusion.",
            "excerpt": "Test excerpt",
            "category": "test"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "AI Structured Article"
    # Should have auto-generated slug
    assert "slug" in data
    # Should have structured_content from AI service
    assert "structured_content" in data or data["structured_content"] is None


def test_save_article_already_saved(client, auth_headers, admin_user, db, test_user):
    """Test saving an article that's already saved"""
    # Create article
    article = Article(
        title="Test",
        content="Content",
        excerpt="Excerpt",
        slug="test",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    # Save it once
    client.post(f"{API_PREFIX}/blog/{article.id}/save", headers=auth_headers)
    
    # Try to save again
    response = client.post(f"{API_PREFIX}/blog/{article.id}/save", headers=auth_headers)
    assert response.status_code == 200
    # Should return existing saved article
    data = response.json()
    assert "id" in data


def test_unsave_article_not_saved(client, auth_headers, admin_user, db):
    """Test unsaving an article that's not in saved list"""
    article = Article(
        title="Test",
        content="Content",
        excerpt="Excerpt",
        slug="test",
        author_id=admin_user.id,
        is_published=True
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.post(f"{API_PREFIX}/blog/unsave/{article.id}", headers=auth_headers)
    assert response.status_code == 404
    assert "not in saved list" in response.json()["detail"].lower()



