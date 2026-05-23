import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Forge AI Backend"
    API_V1_STR: str = "/v1"
    
    # Database: fallback to local aiosqlite if DATABASE_URL is not set
    DATABASE_URL: str = "sqlite+aiosqlite:///./forgeai.db"
    
    REDIS_URL: str = "redis://localhost:6379"
    
    # API Keys
    ANTHROPIC_API_KEY: str = "demo-anthropic-key"
    OPENAI_API_KEY: str = "demo-openai-key"
    CLERK_SECRET_KEY: str = "demo-clerk-key"
    CLERK_JWKS_URL: str = ""
    
    # CORS Origins
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Model config to load from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
