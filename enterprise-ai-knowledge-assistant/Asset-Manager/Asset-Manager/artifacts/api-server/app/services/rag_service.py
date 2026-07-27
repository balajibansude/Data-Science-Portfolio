"""RAG pipeline using LangChain + Ollama."""
from typing import List, Tuple, Optional
from app.config import settings
from app.services.embedding_service import search_similar


def retrieve_context(query: str, db_docs: dict, n: int = None) -> Tuple[str, List[dict]]:
    """Retrieve relevant chunks and format as LLM context.
    db_docs: {document_id: {"filename": ...}}
    Returns: (context_string, citations)
    """
    n = n or settings.top_k_results
    hits = search_similar(query, n_results=n)

    if not hits:
        return "", []

    ctx_parts = []
    citations = []
    for i, hit in enumerate(hits):
        meta = hit.get("metadata", {})
        doc_id = meta.get("document_id")
        page = meta.get("page_number", 1)
        fname = db_docs.get(doc_id, {}).get("filename", "Unknown document")

        ctx_parts.append(f"[Source {i+1}: {fname}, page {page}]\n{hit['text']}")
        citations.append({
            "document_id": doc_id,
            "filename": fname,
            "chunk_text": hit["text"][:400] + ("..." if len(hit["text"]) > 400 else ""),
            "page_number": page,
            "score": round(hit.get("score", 0.0), 4),
        })

    return "\n\n---\n\n".join(ctx_parts), citations


def ask_llm(
    query: str,
    context: str,
    history: Optional[List[dict]] = None,
) -> Tuple[str, Optional[str]]:
    """Send query + context to Ollama via LangChain.
    Returns: (answer_text, model_name)
    """
    if not context:
        return (
            "I don't have any relevant documents to answer that question. "
            "Please upload documents first or rephrase your query.",
            None,
        )

    try:
        from langchain_ollama import ChatOllama
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

        llm = ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=0.1,
        )

        system = (
            "You are an AI assistant for an enterprise knowledge base. "
            "Answer questions ONLY based on the provided document context. "
            "If the answer is not in the documents, say so clearly. "
            "Always mention which source document(s) you used. "
            "Be concise, accurate, and professional."
        )

        messages = [SystemMessage(content=system)]

        # Recent conversation history (last 3 exchanges)
        if history:
            for msg in history[-6:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))

        user_prompt = f"Document context:\n\n{context}\n\nQuestion: {query}"
        messages.append(HumanMessage(content=user_prompt))

        response = llm.invoke(messages)
        return response.content, settings.ollama_model

    except Exception as e:
        error_msg = str(e)
        if "connection" in error_msg.lower() or "refused" in error_msg.lower():
            return (
                "Ollama is not running. Please start Ollama and pull a model "
                f"(e.g. `ollama pull {settings.ollama_model}`), then try again.",
                None,
            )
        return f"Error generating response: {error_msg}", None


def run_rag(
    query: str,
    db,
    history: Optional[List[dict]] = None,
) -> Tuple[str, List[dict], Optional[str]]:
    """Full RAG pipeline: retrieve → format → generate.
    Returns: (answer, citations, model_name)
    """
    from app.models.document import Document

    # Build filename lookup from DB
    docs = db.query(Document).filter(Document.status == "ready").all()
    doc_map = {d.id: {"filename": d.filename} for d in docs}

    context, citations = retrieve_context(query, doc_map)
    answer, model = ask_llm(query, context, history)
    return answer, citations, model
