"""
Database Configuration Module

Configures SQLAlchemy ORM with SQLite database backend.
Provides database session factory and declarative base for model definitions.

Components:
    - engine: SQLAlchemy database engine with SQLite connection
    - SessionLocal: Session factory for creating database sessions
    - Base: Declarative base for SQLAlchemy model classes
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Initialize database engine with SQLite
# check_same_thread=False: Required for SQLite multi-threading support
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    connect_args={"check_same_thread": False}
)

# Create session factory for database operations
# autocommit=False: Explicit transaction management
# autoflush=False: Manual flush control for better performance
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for ORM model definitions
Base = declarative_base()
