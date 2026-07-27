"""Admin routes (require admin role)."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.auth import AdminUserSchema, UserUpdateSchema
from app.schemas.document import AdminDocumentSchema
from app.auth.jwt import require_admin
from app.services.embedding_service import delete_document_chunks
import os

router = APIRouter()


@router.get("/users", response_model=List[AdminUserSchema])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        result.append(AdminUserSchema(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            document_count=len(u.documents),
            conversation_count=len(u.conversations),
        ))
    return result


@router.patch("/users/{user_id}", response_model=AdminUserSchema)
def update_user(
    user_id: int,
    body: UserUpdateSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    db.commit()
    db.refresh(user)
    return AdminUserSchema(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        document_count=len(user.documents),
        conversation_count=len(user.conversations),
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"success": True, "message": "User deleted"}


@router.get("/documents", response_model=List[AdminDocumentSchema])
def list_all_documents(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    result = []
    for d in docs:
        result.append(AdminDocumentSchema(
            id=d.id,
            filename=d.filename,
            file_type=d.file_type,
            size_bytes=d.size_bytes,
            status=d.status,
            category=d.category,
            created_at=d.created_at,
            uploaded_by_email=d.uploader.email if d.uploader else "unknown",
        ))
    return result


@router.delete("/documents/{doc_id}")
def admin_delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    delete_document_chunks(doc_id)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Document deleted"}
