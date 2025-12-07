"""
User Pydantic Schemas Module

Request/response validation schemas for user authentication and management.

This module defines Pydantic models for:
- User registration and login validation
- User data serialization (excluding sensitive fields)
- JWT token structure
- Token payload parsing

Schema Hierarchy:
- UserBase: Shared properties base class
- UserCreate: Registration request validation
- User: API response serialization
- Token: JWT authentication response
- TokenPayload: Decoded JWT claims

Technical Notes:
- EmailStr validation ensures proper email format
- orm_mode enables SQLAlchemy model conversion
- Passwords excluded from User response schema for security
"""

from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    """
    Base user schema with shared properties.
    
    Defines common fields used across user-related operations.
    Not used directly in endpoints but inherited by other schemas.
    
    Attributes:
        email (EmailStr, optional): User email address with validation
        is_active (bool, optional): Account activation status (default: True)
        full_name (str, optional): User's display name
        is_admin (bool, optional): Administrator privileges flag (default: False)
        language (str, optional): Preferred UI language code (default: "it")
    """
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    is_admin: Optional[bool] = False
    language: Optional[str] = "it"

class UserCreate(UserBase):
    """
    User registration request schema.
    
    Validates required fields for new user account creation.
    Password is required but never returned in responses.
    
    Attributes:
        email (EmailStr): Valid email address (required, unique)
        password (str): Plain text password (hashed before storage)
        full_name (str): User's display name (required)
        
    Example:
        {
            "email": "user@example.com",
            "password": "securepass123",
            "full_name": "John Doe"
        }
    """
    email: EmailStr
    password: str
    full_name: str

class User(UserBase):
    """
    User API response schema.
    
    Serializes user data for API responses, excluding sensitive fields
    like hashed_password. Inherits optional fields from UserBase.
    
    Attributes:
        id (int): Unique user identifier (from database)
        
    Config:
        orm_mode (bool): Enables SQLAlchemy ORM model conversion
        
    Example Response:
        {
            "id": 1,
            "email": "user@example.com",
            "full_name": "John Doe",
            "is_active": true,
            "is_admin": false,
            "language": "it"
        }
        
    Technical Notes:
        - ORM mode allows direct SQLAlchemy model to schema conversion
        - Excludes hashed_password field automatically
    """
    id: int
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    """
    JWT authentication token response schema.
    
    OAuth2-compliant token response for successful login.
    
    Attributes:
        access_token (str): JWT token string (encrypted user claims)
        token_type (str): Token type (always "bearer" for OAuth2)
        
    Example:
        {
            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "token_type": "bearer"
        }
    """
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    """
    Decoded JWT token payload schema.
    
    Represents claims extracted from JWT token after verification.
    Used internally for user authentication.
    
    Attributes:
        sub (int, optional): Subject - user ID from token claims
        
    Technical Notes:
        - sub field maps to user.id in database
        - None value indicates invalid/expired token
    """
    sub: Optional[int] = None
