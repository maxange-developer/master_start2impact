"""
API Dependencies Module

Provides reusable dependency injection functions for FastAPI endpoints.

Key Dependencies:
    - get_db: Database session management with automatic cleanup
    - get_current_user: JWT token validation and user retrieval
    - reusable_oauth2: OAuth2 password bearer token scheme

Authentication Flow:
    Request → OAuth2PasswordBearer → JWT decode → User lookup → Endpoint

Database Session Lifecycle:
    Endpoint call → SessionLocal() → Yield to endpoint → db.close()

Technical Notes:
    - OAuth2 tokenUrl points to /api/v1/auth/login
    - JWT verification uses HS256 algorithm
    - Sessions auto-closed even on exceptions (finally block)
    - 403 Forbidden for invalid tokens
    - 404 Not Found for non-existent users
"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import SessionLocal
from app.models import user as models
from app.schemas import user as schemas

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> Generator:
    """
    Provide database session with automatic cleanup.
    
    Creates SQLAlchemy session for endpoint use and ensures
    proper closure even on exceptions.
    
    Yields:
        Session: SQLAlchemy database session
        
    Technical Notes:
        - Session created from SessionLocal factory
        - Automatically closed in finally block
        - Thread-safe session management
        - Used as FastAPI dependency: db: Session = Depends(get_db)
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    """
    Validate JWT token and retrieve authenticated user.
    
    Decodes JWT token from Authorization header, validates signature
    and expiration, then retrieves user from database.
    
    Args:
        db (Session): Database session from get_db dependency
        token (str): JWT token from OAuth2PasswordBearer (Authorization header)
        
    Returns:
        User: Authenticated user object from database
        
    Raises:
        HTTPException 403: Invalid token signature, expired token, or validation error
        HTTPException 404: Token valid but user not found in database
        
    Example:
        @router.get("/me")
        def read_current_user(current_user: User = Depends(get_current_user)):
            return current_user
            
    Technical Notes:
        - Verifies token with SECRET_KEY and ALGORITHM (HS256)
        - Extracts user_id from token 'sub' claim
        - Queries database for user with extracted ID
        - Used as dependency in protected endpoints
        - Token must be in format: "Bearer <token>"
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(models.User).filter(models.User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
