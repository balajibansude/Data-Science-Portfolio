"""
Enterprise AI Knowledge Assistant - FastAPI Backend
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    # Create all database tables
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)

    # Initialize ChromaDB client & collection (also creates persist dir)
    from app.services.embedding_service import get_collection
    get_collection()

    # Ensure upload directory exists
    os.makedirs("uploads", exist_ok=True)

    yield  # Application runs here


app = FastAPI(
    title="Enterprise AI Knowledge Assistant",
    description="RAG-based enterprise document Q&A system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow the Vite frontend (served at /)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under /api (matches artifact.toml paths = ["/api"])
from app.routers import auth, documents, chat, dashboard, admin

app.include_router(auth.router,       prefix="/api/auth",          tags=["auth"])
app.include_router(documents.router,  prefix="/api/documents",     tags=["documents"])
app.include_router(chat.router,       prefix="/api/conversations",  tags=["conversations"])
app.include_router(dashboard.router,  prefix="/api/dashboard",     tags=["dashboard"])
app.include_router(admin.router,      prefix="/api/admin",         tags=["admin"])


@app.get("/api/healthz", tags=["health"])
async def health_check():
    return {"status": "ok"}
