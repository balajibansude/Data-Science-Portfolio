"""Dashboard stats route."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation, Message
from app.schemas.document import DocumentSchema
from app.schemas.conversation import ConversationSchema
from app.auth.jwt import get_current_user

router = APIRouter()


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = current_user.role == "admin"

    # Document query scope
    doc_q = db.query(Document)
    if not is_admin:
        doc_q = doc_q.filter(Document.uploaded_by_id == current_user.id)

    docs = doc_q.all()
    total_docs = len(docs)

    # Conversations
    conv_q = db.query(Conversation)
    if not is_admin:
        conv_q = conv_q.filter(Conversation.user_id == current_user.id)
    convs = conv_q.all()
    total_convs = len(convs)

    # Messages
    if is_admin:
        total_msgs = db.query(Message).count()
    else:
        conv_ids = [c.id for c in convs]
        total_msgs = db.query(Message).filter(Message.conversation_id.in_(conv_ids)).count() if conv_ids else 0

    # Recent items
    recent_docs = doc_q.order_by(Document.created_at.desc()).limit(5).all()
    recent_convs = conv_q.order_by(Conversation.updated_at.desc().nullslast(), Conversation.created_at.desc()).limit(5).all()

    # Breakdowns
    categories: dict = {}
    doc_types: dict = {}
    for d in docs:
        cat = d.category or "Uncategorized"
        categories[cat] = categories.get(cat, 0) + 1
        dt = d.file_type or "unknown"
        doc_types[dt] = doc_types.get(dt, 0) + 1

    recent_conv_schemas = []
    for c in recent_convs:
        recent_conv_schemas.append(ConversationSchema(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=len(c.messages),
        ))

    return {
        "total_documents": total_docs,
        "total_conversations": total_convs,
        "total_messages": total_msgs,
        "recent_documents": [DocumentSchema.model_validate(d) for d in recent_docs],
        "recent_conversations": recent_conv_schemas,
        "documents_by_category": categories,
        "documents_by_type": doc_types,
    }
