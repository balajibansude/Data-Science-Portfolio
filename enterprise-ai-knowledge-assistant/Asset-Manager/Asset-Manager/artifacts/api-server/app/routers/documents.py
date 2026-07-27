"""Document routes: upload, list, search, delete."""
import os
import uuid
import threading
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentSchema, ChunkSchema, SearchResultSchema, DocumentStatsSchema
from app.auth.jwt import get_current_user
from app.config import settings
from app.services.document_processor import extract_text, chunk_text, get_file_type
from app.services.embedding_service import add_chunks, search_similar, delete_document_chunks
from app.services.classification_service import classify_document, extract_topics

router = APIRouter()

ALLOWED_TYPES = {"pdf", "docx", "doc", "txt", "csv"}


def _process_document_async(document_id: int):
    """Background thread: extract, embed, classify, update status."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        # Extract text
        text, pages = extract_text(doc.file_path, doc.file_type)
        doc.page_count = pages

        # Chunk text
        chunks = chunk_text(text)

        # Classify and extract topics
        doc.category = classify_document(text)
        doc.topics = extract_topics(text)

        # Embed and store in ChromaDB
        chroma_ids = add_chunks(document_id, chunks)

        # Persist chunk records
        for i, (chunk_dict, cid) in enumerate(zip(chunks, chroma_ids)):
            db_chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=i,
                page_number=chunk_dict.get("page_number", 1),
                text=chunk_dict["text"],
                chroma_id=cid,
            )
            db.add(db_chunk)

        doc.chunk_count = len(chunks)
        doc.status = "ready"
        db.commit()
    except Exception as e:
        db.rollback()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            doc.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.get("", response_model=List[DocumentSchema])
def list_documents(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Document)
    # Admins see all; users see only their own
    if current_user.role != "admin":
        q = q.filter(Document.uploaded_by_id == current_user.id)
    if category:
        q = q.filter(Document.category == category)
    if status:
        q = q.filter(Document.status == status)
    docs = q.order_by(Document.created_at.desc()).all()
    return [DocumentSchema.model_validate(d) for d in docs]


@router.post("/upload", response_model=DocumentSchema, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_type = get_file_type(file.filename or "unknown")
    if file_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported type. Allowed: {', '.join(ALLOWED_TYPES)}")

    # Check file size
    content = await file.read()
    size_bytes = len(content)
    if size_bytes > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.max_file_size_mb} MB)")

    # Save file
    os.makedirs(settings.upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record
    doc = Document(
        filename=file.filename,
        original_filename=file.filename,
        file_type=file_type,
        size_bytes=size_bytes,
        status="processing",
        file_path=file_path,
        uploaded_by_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process asynchronously
    t = threading.Thread(target=_process_document_async, args=(doc.id,), daemon=True)
    t.start()

    return DocumentSchema.model_validate(doc)


@router.get("/search", response_model=List[SearchResultSchema])
def search(
    q: str = Query(...),
    limit: int = Query(10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hits = search_similar(q, n_results=limit)
    results = []
    seen = set()
    for hit in hits:
        doc_id = hit["metadata"].get("document_id")
        if doc_id in seen:
            continue
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            continue
        # Access control
        if current_user.role != "admin" and doc.uploaded_by_id != current_user.id:
            continue
        seen.add(doc_id)
        results.append(SearchResultSchema(
            document_id=doc_id,
            filename=doc.filename,
            chunk_text=hit["text"][:500],
            score=round(hit.get("score", 0.0), 4),
            page_number=hit["metadata"].get("page_number", 1),
        ))
    return results


@router.get("/stats", response_model=DocumentStatsSchema)
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    q = db.query(Document)
    if current_user.role != "admin":
        q = q.filter(Document.uploaded_by_id == current_user.id)
    docs = q.all()

    categories: dict = {}
    doc_types: dict = {}
    for d in docs:
        cat = d.category or "Uncategorized"
        categories[cat] = categories.get(cat, 0) + 1
        dt = d.file_type
        doc_types[dt] = doc_types.get(dt, 0) + 1

    total_chunks = sum(d.chunk_count for d in docs)
    return DocumentStatsSchema(
        total_documents=len(docs),
        total_chunks=total_chunks,
        categories=categories,
        document_types=doc_types,
        processing_count=sum(1 for d in docs if d.status == "processing"),
        ready_count=sum(1 for d in docs if d.status == "ready"),
        error_count=sum(1 for d in docs if d.status == "error"),
    )


@router.get("/{doc_id}", response_model=DocumentSchema)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != "admin" and doc.uploaded_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return DocumentSchema.model_validate(doc)


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != "admin" and doc.uploaded_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    delete_document_chunks(doc_id)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Document deleted"}


@router.get("/{doc_id}/chunks", response_model=List[ChunkSchema])
def get_chunks(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != "admin" and doc.uploaded_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index).all()
    return [ChunkSchema.model_validate(c) for c in chunks]
