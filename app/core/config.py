"""
Configuration module.

Handles application settings and environment variables securely using Pydantic Settings.
"""

from typing import List
from pydantic import AnyHttpUrl, BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated


def parse_cors_origins(v: str | List[str]) -> List[str]:
    """
    Parses CORS origins from a comma-separated string or a list.
    """
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    """
    Application Settings configuration class.
    
    Loads configuration from environment variables and an optional .env file.
    """
    PROJECT_NAME: str = "Next-Gen Smart City & Mega-Tourism Ecosystem"
    API_V1_STR: str = "/api/v1"

    # CORS Configuration
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors_origins)
    ] = ["*"]

    # Gemini LLM Service Configuration
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Application Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True

    # Pydantic Settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
