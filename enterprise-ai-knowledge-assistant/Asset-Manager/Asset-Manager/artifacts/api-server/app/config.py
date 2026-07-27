"""Application configuration via pydantic-settings."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # JWT
    secret_key: str = os.environ.get("SESSION_SECRET", "dev-secret-change-me")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Database
    database_url: str = os.environ.get("DATABASE_URL", "")

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "knowledge_base"

    # Uploads
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50

    # Ollama
    ollama_base_url: str = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.environ.get("OLLAMA_MODEL", "llama3.2")

    # RAG
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
