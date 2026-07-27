from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class DocumentSchema(BaseModel):
    id: int
    filename: str
    file_type: str
    size_bytes: int
    status: str
    category: Optional[str] = None
    topics: List[str] = []
    page_count: int
    chunk_count: int
    created_at: datetime
    uploaded_by_id: int

    model_config = {"from_attributes": True}


class ChunkSchema(BaseModel):
    id: int
    text: str
    page_number: int
    chunk_index: int

    model_config = {"from_attributes": True}


class SearchResultSchema(BaseModel):
    document_id: int
    filename: str
    chunk_text: str
    score: float
    page_number: int


class DocumentStatsSchema(BaseModel):
    total_documents: int
    total_chunks: int
    categories: dict
    document_types: dict
    processing_count: int
    ready_count: int
    error_count: int


class AdminDocumentSchema(BaseModel):
    id: int
    filename: str
    file_type: str
    size_bytes: int
    status: str
    category: Optional[str] = None
    created_at: datetime
    uploaded_by_email: str

    model_config = {"from_attributes": True}
