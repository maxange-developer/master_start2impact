"""
API Router Configuration Module

Central router configuration that aggregates all endpoint modules
into a single FastAPI APIRouter with organized prefixes and tags.

Architecture:
    api_router (APIRouter)
    ├── /auth (Authentication endpoints)
    ├── /search (AI search endpoints)
    └── /blog (Blog management endpoints)

Endpoint Groups:
    - auth: User registration, login, token management
    - search: AI-powered Tenerife activity search
    - blog: Article CRUD, image upload, saved articles

Technical Notes:
    - Imported in main.py and mounted at /api/v1
    - Tags enable automatic OpenAPI documentation grouping
    - Prefixes provide RESTful URL structure
"""

from fastapi import APIRouter

api_router = APIRouter()

from app.api.endpoints import auth, search, blog

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])



