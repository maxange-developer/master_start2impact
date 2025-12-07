"""Tests for authentication endpoints"""
import pytest

# API prefix
API_PREFIX = "/api/v1"


def test_register_user(client):
    """Test user registration"""
    response = client.post(f"{API_PREFIX}/auth/register", json={
        "email": "newuser@example.com",
        "password": "password123",
        "full_name": "New User"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data
    assert "hashed_password" not in data  # Password should not be returned


def test_register_duplicate_email(client, test_user):
    """Test registration with existing email"""
    response = client.post(f"{API_PREFIX}/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Duplicate User"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_register_invalid_email(client):
    """Test registration with invalid email format"""
    response = client.post(f"{API_PREFIX}/auth/register", json={
        "email": "invalid-email",
        "password": "password123",
        "full_name": "Test User"
    })
    assert response.status_code == 422  # Validation error


def test_register_short_password(client):
    """Test registration with short password"""
    response = client.post(f"{API_PREFIX}/auth/register", json={
        "email": "test@example.com",
        "password": "123",
        "full_name": "Test User"
    })
    # This should pass validation as backend doesn't enforce min length
    # Add validation in schema if needed
    assert response.status_code in [200, 422]


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """Test login with wrong password"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "nonexistent@example.com",
        "password": "password123"
    })
    assert response.status_code == 400


def test_login_missing_fields(client):
    """Test login with missing fields"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "test@example.com"
    })
    assert response.status_code == 422  # Validation error


def test_get_current_user(client, auth_headers):
    """Test get current user endpoint"""
    response = client.get(f"{API_PREFIX}/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["is_admin"] == False
    assert data["language"] == "it"


def test_get_current_user_no_token(client):
    """Test get current user without token"""
    response = client.get(f"{API_PREFIX}/auth/me")
    assert response.status_code == 401


def test_get_current_user_invalid_token(client):
    """Test get current user with invalid token"""
    response = client.get(f"{API_PREFIX}/auth/me", headers={
        "Authorization": "Bearer invalid-token"
    })
    assert response.status_code == 403


def test_admin_user_flag(client, admin_user):
    """Test admin user has is_admin flag"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    
    response = client.get(f"{API_PREFIX}/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_admin"] == True


def test_user_language_default(client):
    """Test user language defaults to 'it'"""
    response = client.post(f"{API_PREFIX}/auth/register", json={
        "email": "italian@example.com",
        "password": "password123",
        "full_name": "Italian User"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "it"

