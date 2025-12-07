"""
Application Configuration Module

Centralized settings management for the Tenerife AI Activity Finder API.
All configuration values are loaded from environment variables via .env file.

Environment Variables:
    - SECRET_KEY: JWT secret key for token signing (CHANGE IN PRODUCTION)
    - ALGORITHM: JWT algorithm (default: HS256)
    - ACCESS_TOKEN_EXPIRE_MINUTES: JWT token expiration time
    - SQLALCHEMY_DATABASE_URI: Database connection string
    - OPENAI_API_KEY: OpenAI API key for article structuring
    - TAVILY_API_KEY: Tavily API key for web search
"""

from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
from pathlib import Path

# Resolve .env file path relative to this configuration module
ENV_FILE_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Attributes:
        PROJECT_NAME: Application display name
        API_V1_STR: API version prefix (e.g., /api/v1)
        SECRET_KEY: Secret key for JWT token signing
        ALGORITHM: JWT algorithm for token encoding/decoding
        ACCESS_TOKEN_EXPIRE_MINUTES: Token expiration time in minutes
        BACKEND_CORS_ORIGINS: List of allowed CORS origins
        SQLALCHEMY_DATABASE_URI: Database connection URI
        OPENAI_API_KEY: OpenAI API credentials
        TAVILY_API_KEY: Tavily API credentials for web search
    """
    
    PROJECT_NAME: str = "Tenerife AI Activity Finder"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "aejUOWY7qptc4x2l-Es%ZQo1@CLyfPJ#36F5M*SRTGKwN0BV9+zu8nimX!bk=D&$"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        return []

    # Database Configuration
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./sql_app.db"

    # AI & Search API Keys (loaded from .env)
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""

    class Config:
        """Pydantic configuration for environment variables."""
        case_sensitive = True
        env_file = str(ENV_FILE_PATH)

# Singleton settings instance
settings = Settings()
