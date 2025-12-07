"""Pytest configuration and fixtures"""
import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
from app.core.database import Base
from app.models.user import User
from app.core.security import get_password_hash


# In-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# API prefix
API_PREFIX = "/api/v1"


def get_db_override():
    """Override database dependency for tests"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """FastAPI test client with test database"""
    from app.core.database import SessionLocal
    
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    # Override the dependency
    from app.api.deps import get_db
    app.dependency_overrides[get_db] = override_get_db
    
    yield TestClient(app)
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create test user"""
    fixtures_path = Path(__file__).parent / "fixtures" / "users.json"
    with open(fixtures_path) as f:
        users_data = json.load(f)
    
    user_data = users_data["test_user"]
    user = User(
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=get_password_hash(user_data["password"]),
        is_admin=user_data["is_admin"],
        language=user_data["language"]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    """Create admin user"""
    fixtures_path = Path(__file__).parent / "fixtures" / "users.json"
    with open(fixtures_path) as f:
        users_data = json.load(f)
    
    user_data = users_data["admin_user"]
    user = User(
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=get_password_hash(user_data["password"]),
        is_admin=user_data["is_admin"],
        language=user_data["language"]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get JWT token for test user"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "test@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, admin_user):
    """Get JWT token for admin user"""
    response = client.post(f"{API_PREFIX}/auth/login", data={
        "username": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_openai_response():
    """Load mock OpenAI response from fixtures"""
    fixtures_path = Path(__file__).parent / "fixtures" / "activities.json"
    with open(fixtures_path) as f:
        return json.load(f)


@pytest.fixture
def mock_tavily_response():
    """Load mock Tavily response from fixtures"""
    fixtures_path = Path(__file__).parent / "fixtures" / "images.json"
    with open(fixtures_path) as f:
        return json.load(f)
