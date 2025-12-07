import pytest
from fastapi import HTTPException
from jose import jwt
from app.api import deps
from app.core.config import settings
from app.models.user import User

API_PREFIX = "/api/v1"


def test_get_db(db):
    """Test database session generator"""
    gen = deps.get_db()
    session = next(gen)
    assert session is not None
    # Close the generator
    try:
        next(gen)
    except StopIteration:
        pass


def test_get_current_user_valid_token(client, test_user, db):
    """Test get current user with valid token"""
    # Login to get a valid token
    response = client.post(
        f"{API_PREFIX}/auth/login",
        data={"username": test_user.email, "password": "password123"}
    )
    token = response.json()["access_token"]
    
    # Get current user using the token
    from app.api.deps import reusable_oauth2
    user = deps.get_current_user(db=db, token=token)
    
    assert user.id == test_user.id
    assert user.email == test_user.email


def test_get_current_user_invalid_token(db):
    """Test get current user with invalid token"""
    invalid_token = "invalid.token.here"
    
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_user(db=db, token=invalid_token)
    
    assert exc_info.value.status_code == 403
    assert "Could not validate credentials" in str(exc_info.value.detail)


def test_get_current_user_expired_token(db, test_user):
    """Test get current user with expired token"""
    from datetime import timedelta, datetime
    
    # Create an expired token
    expire = datetime.utcnow() - timedelta(minutes=30)  # Expired 30 minutes ago
    to_encode = {"exp": expire, "sub": str(test_user.id)}
    expired_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_user(db=db, token=expired_token)
    
    assert exc_info.value.status_code == 403


def test_get_current_user_nonexistent_user(db):
    """Test get current user with token for non-existent user"""
    from datetime import timedelta, datetime
    
    # Create a token for a user that doesn't exist
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"exp": expire, "sub": "99999"}  # Non-existent user ID
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_user(db=db, token=token)
    
    assert exc_info.value.status_code == 404
    assert "User not found" in str(exc_info.value.detail)


def test_get_current_user_malformed_payload(db):
    """Test get current user with token containing malformed payload"""
    from datetime import timedelta, datetime
    
    # Create a token with missing 'sub' field
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"exp": expire}  # Missing 'sub'
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_user(db=db, token=token)
    
    # Can be either 403 (validation error) or 404 (user not found with None/null sub)
    assert exc_info.value.status_code in [403, 404]
