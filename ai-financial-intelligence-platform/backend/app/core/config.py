from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables or a local .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_name: str = "AI Financial Intelligence Platform API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://platform_user:change-me-for-local-development@localhost:5432/financial_intelligence"
    backend_cors_origins: list[str] | str = ["http://localhost:5173"]
    upload_dir: Path = Path("data/uploads")
    reports_dir: Path = Path("data/reports")
    models_dir: Path = Path("data/models")
    upload_max_size_bytes: int = 10 * 1024 * 1024

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        """Allow either JSON arrays or a convenient comma-separated env value."""
        if isinstance(value, str):
            if not value.lstrip().startswith("["):
                return [origin.strip() for origin in value.split(",") if origin.strip()]
            import json
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
