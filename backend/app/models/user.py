"""
User Model Module

SQLAlchemy ORM model for user authentication and authorization.

This module defines the User table structure with support for:
- Email-based authentication
- Role-based access control (admin/regular users)
- Multi-language preferences
- Account activation status

Database Table: users
Primary Key: id (auto-incrementing integer)
Unique Constraints: email
Indexes: id, email, full_name
"""

from sqlalchemy import Boolean, Column, Integer, String
from app.core.database import Base

class User(Base):
    """
    User account model for authentication and authorization.
    
    Attributes:
        id (int): Unique user identifier (primary key)
        email (str): User email address (unique, indexed for login)
        full_name (str): User's display name (indexed for search)
        hashed_password (str): Argon2 hashed password (never exposed in responses)
        is_active (bool): Account activation status (default: True)
        is_admin (bool): Administrator privileges flag (default: False)
        language (str): Preferred UI language code (default: "it")
        
    Database Configuration:
        - Email uniqueness enforced at DB level
        - Indexes on id, email, and full_name for query performance
        - Supports multi-language interface (ES, EN, DE, FR, IT)
        
    Security Notes:
        - Passwords are hashed with Argon2 (memory-hard algorithm)
        - hashed_password field excluded from Pydantic response schemas
        - is_active flag enables soft account deactivation
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    language = Column(String, default="it")  # Default language: Italian
