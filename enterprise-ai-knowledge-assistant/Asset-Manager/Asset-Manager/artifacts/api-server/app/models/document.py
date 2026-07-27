"""Document and DocumentChunk models."""
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)         # pdf | docx | txt | csv
    size_bytes = Column(BigInteger, default=0)
    status = Column(String, default="processing")      # processing | ready | error
    category = Column(String, nullable=True)           # HR | Finance | Legal | Engineering | Marketing
    topics = Column(JSON, default=list)
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    file_path = Column(String, nullable=False)
    error_message = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    uploader = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    text = Column(Text, nullable=False)
    chroma_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="chunks")
