"""
FastAPI Application Entry Point

This module serves as the main entry point for the Tenerife AI Activity Finder API.
It initializes the FastAPI application, configures CORS middleware, sets up database
tables, and includes all API routers.

Configuration:
    - CORS: Allow all origins, methods, and headers (configurable for production)
    - Database: SQLAlchemy ORM with SQLite
    - API Version: Configurable via settings
    - OpenAPI: Enabled with automatic endpoint documentation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.core.database import Base, engine

# Initialize database tables on application startup
Base.metadata.create_all(bind=engine)

# Create FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS middleware for cross-origin requests
# Production: Restrict to specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (configure in production)
    allow_credentials=False,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include API routers with version prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    """
    Root endpoint for API health check.
    
    Returns:
        dict: Welcome message with API information
    """
    return {"message": "Welcome to Tenerife AI Activity Finder API"}
