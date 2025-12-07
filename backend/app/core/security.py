"""
Security and Authentication Module

Handles JWT token generation, password hashing, and authentication utilities.
Uses Argon2 for password hashing (memory-hard algorithm resistant to GPU attacks)
and JOSE for JWT token operations.

Features:
    - Argon2 password hashing with automatic salt
    - JWT token generation with configurable expiration
    - Password verification with constant-time comparison
"""

from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Initialize password hashing context with Argon2 algorithm
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    Generate JWT access token for user authentication.
    
    Args:
        subject: User identifier (ID or email)
        expires_delta: Custom token expiration duration. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES
    
    Returns:
        str: Encoded JWT token with expiration and subject claims
    
    Raises:
        JWTError: If token encoding fails
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # JWT payload with standard claims
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password using Argon2.
    
    Args:
        plain_password: User-provided password in plain text
        hashed_password: Stored hashed password from database
    
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash plain password using Argon2 algorithm.
    
    Args:
        password: Plain text password to hash
    
    Returns:
        str: Hashed password with salt
    """
    return pwd_context.hash(password)
