"""ChromaDB vector store operations."""
import os
import uuid
from typing import List, Optional
import chromadb
from app.config import settings

_client: Optional[chromadb.PersistentClient] = None
_collection = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(document_id: int, chunks: List[dict]) -> List[str]:
    """Embed and store chunks. Returns list of chroma IDs.
    chunks: [{"text": ..., "page_number": ...}]
    """
    collection = get_collection()
    if not chunks:
        return []

    ids, texts, metas = [], [], []
    for i, chunk in enumerate(chunks):
        cid = f"doc{document_id}_c{i}_{uuid.uuid4().hex[:6]}"
        ids.append(cid)
        texts.append(chunk["text"])
        metas.append({
            "document_id": document_id,
            "chunk_index": i,
            "page_number": chunk.get("page_number", 1),
        })

    # Batch insert (avoid OOM on large docs)
    batch = 100
    for i in range(0, len(ids), batch):
        collection.add(
            ids=ids[i:i+batch],
            documents=texts[i:i+batch],
            metadatas=metas[i:i+batch],
        )

    return ids


def search_similar(query: str, n_results: int = 5, document_ids: Optional[List[int]] = None) -> List[dict]:
    """Semantic search. Returns ranked list of hits."""
    collection = get_collection()
    count = collection.count()
    if count == 0:
        return []

    where = None
    if document_ids:
        if len(document_ids) == 1:
            where = {"document_id": document_ids[0]}
        else:
            where = {"document_id": {"$in": document_ids}}

    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, count),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
    except Exception:
        return []

    hits = []
    if results and results["ids"] and results["ids"][0]:
        for i, cid in enumerate(results["ids"][0]):
            dist = results["distances"][0][i]
            hits.append({
                "chunk_id": cid,
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": max(0.0, 1.0 - dist),
            })
    return hits


def delete_document_chunks(document_id: int) -> None:
    try:
        get_collection().delete(where={"document_id": document_id})
    except Exception:
        pass


def get_total_chunks() -> int:
    try:
        return get_collection().count()
    except Exception:
        return 0
