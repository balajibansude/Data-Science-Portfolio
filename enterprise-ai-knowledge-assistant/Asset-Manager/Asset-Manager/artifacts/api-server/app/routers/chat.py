"""Conversation and message routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.conversation import (
    ConversationInputSchema,
    ConversationSchema,
    ConversationDetailSchema,
    MessageSchema,
    MessageInputSchema,
    ChatResponseSchema,
    CitationSchema,
)
from app.auth.jwt import get_current_user
from app.services.rag_service import run_rag

router = APIRouter()


@router.get("", response_model=List[ConversationSchema])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())
        .all()
    )
    result = []
    for c in convs:
        result.append(ConversationSchema(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=len(c.messages),
        ))
    return result


@router.post("", response_model=ConversationSchema, status_code=201)
def create_conversation(
    body: ConversationInputSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(title=body.title or "New Conversation", user_id=current_user.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationSchema(id=conv.id, title=conv.title, created_at=conv.created_at, message_count=0)


@router.get("/{conv_id}", response_model=ConversationDetailSchema)
def get_conversation(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetailSchema.model_validate(conv)


@router.delete("/{conv_id}")
def delete_conversation(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"success": True, "message": "Conversation deleted"}


@router.post("/{conv_id}/messages", response_model=ChatResponseSchema)
def send_message(
    conv_id: int,
    body: MessageInputSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    user_msg = Message(conversation_id=conv_id, role="user", content=body.content)
    db.add(user_msg)
    db.commit()

    # Build history for context
    history = [{"role": m.role, "content": m.content} for m in conv.messages[:-1]]

    # Run RAG pipeline
    answer, citations, model_name = run_rag(body.content, db, history)

    # Save assistant message
    citation_dicts = [c if isinstance(c, dict) else c.model_dump() for c in citations]
    assistant_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=answer,
        citations=citation_dicts,
        model=model_name,
    )
    db.add(assistant_msg)

    # Update conversation title on first exchange
    if len(conv.messages) <= 2 and conv.title in ("New Conversation", ""):
        conv.title = body.content[:60] + ("..." if len(body.content) > 60 else "")

    db.commit()
    db.refresh(assistant_msg)

    citation_schemas = [CitationSchema(**c) for c in citation_dicts]
    return ChatResponseSchema(
        message_id=assistant_msg.id,
        content=answer,
        citations=citation_schemas,
        model=model_name,
    )
