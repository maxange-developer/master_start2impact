"""
Authentication Endpoint Module

This module implements user authentication endpoints including login and registration
functionality with JWT token generation and OAuth2 password flow compliance.

Key Features:
    - OAuth2 compliant login endpoint
    - User registration with email validation
    - JWT access token generation
    - Password hashing and verification
    - Active user status validation

Security:
    - Passwords are hashed using Argon2
    - Access tokens expire after configured duration
    - Email uniqueness enforced at database level
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.models import user as models
from app.schemas import user as schemas

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login endpoint for user authentication.
    
    This endpoint validates user credentials and returns a JWT access token
    for subsequent authenticated requests. Follows OAuth2 password flow specification.
    
    Args:
        db (Session): SQLAlchemy database session
        form_data (OAuth2PasswordRequestForm): Contains username (email) and password
        
    Returns:
        dict: Contains access_token and token_type
        
    Raises:
        HTTPException 400: Invalid credentials or inactive user
        
    Example:
        POST /api/v1/auth/login
        Body: {
            "username": "user@example.com",
            "password": "securepass123"
        }
        Response: {
            "access_token": "eyJ0eXAiOiJKV1QiLCJ...",
            "token_type": "bearer"
        }
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = security.timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=schemas.User)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    User registration endpoint for creating new user accounts.
    
    Validates email uniqueness and creates a new user with hashed password.
    New users are automatically set to active status.
    
    Args:
        db (Session): SQLAlchemy database session
        user_in (UserCreate): User registration data (email, password)
        
    Returns:
        User: Created user object without password hash
        
    Raises:
        HTTPException 400: Email already registered in system
        
    Example:
        POST /api/v1/auth/register
        Body: {
            "email": "newuser@example.com",
            "password": "securepass123"
        }
        Response: {
            "id": 1,
            "email": "newuser@example.com",
            "is_active": true,
            "is_admin": false
        }
    """
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    user = models.User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
