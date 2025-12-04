import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Course Integrity Monitor"
    database_url: str = Field(
        default=os.getenv("DATABASE_URL", "sqlite:///./app.db"),
        description="SQLAlchemy style database URL",
    )
    redis_url: str = Field(
        default=os.getenv("REDIS_URL", "redis://redis:6379/0"),
        description="Redis connection URI used for caching analytics",
    )
    ai_pipeline_url: str = Field(
        default=os.getenv("AI_PIPELINE_URL", "http://ai-pipeline:8001"),
        description="Base URL for the AI detection microservice",
    )
    allow_origins: list[str] = Field(
        default_factory=lambda: os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
