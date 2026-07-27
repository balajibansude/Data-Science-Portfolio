from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class ConversationInputSchema(BaseModel):
    title: str = "New Conversation"


class CitationSchema(BaseModel):
    document_id: int
    filename: str
    chunk_text: str
    page_number: int
    score: float


class MessageSchema(BaseModel):
    id: int
    role: str
    content: str
    citations: List[Any] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSchema(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0

    model_config = {"from_attributes": True}


class ConversationDetailSchema(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[MessageSchema] = []

    model_config = {"from_attributes": True}


class MessageInputSchema(BaseModel):
    content: str


class ChatResponseSchema(BaseModel):
    message_id: int
    content: str
    citations: List[CitationSchema] = []
    model: Optional[str] = None
