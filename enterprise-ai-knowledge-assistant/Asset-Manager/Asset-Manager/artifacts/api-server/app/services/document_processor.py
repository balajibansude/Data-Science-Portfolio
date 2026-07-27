"""Document text extraction and chunking."""
from pathlib import Path
from typing import List, Tuple
from app.config import settings


def extract_text(file_path: str, file_type: str) -> Tuple[str, int]:
    """Extract text from a file. Returns (text, page_count)."""
    ft = file_type.lower().lstrip(".")
    if ft == "pdf":
        return _extract_pdf(file_path)
    elif ft in ("docx", "doc"):
        return _extract_docx(file_path)
    elif ft == "txt":
        return _extract_txt(file_path)
    elif ft == "csv":
        return _extract_csv(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def _extract_pdf(path: str) -> Tuple[str, int]:
    from pypdf import PdfReader
    reader = PdfReader(path)
    pages_text = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages_text.append(text)
    return "\n\n".join(pages_text), len(reader.pages)


def _extract_docx(path: str) -> Tuple[str, int]:
    from docx import Document
    doc = Document(path)
    paras = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n".join(paras)
    pages = max(1, len(text.split()) // 500)
    return text, pages


def _extract_txt(path: str) -> Tuple[str, int]:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    pages = max(1, len(text.split()) // 500)
    return text, pages


def _extract_csv(path: str) -> Tuple[str, int]:
    import pandas as pd
    df = pd.read_csv(path)
    lines = [
        f"CSV file: {len(df)} rows × {len(df.columns)} columns.",
        f"Columns: {', '.join(df.columns.tolist())}",
        "",
        df.to_string(index=False, max_rows=500),
    ]
    return "\n".join(lines), 1


def chunk_text(text: str) -> List[dict]:
    """Split text into overlapping chunks.
    Returns list of {"text": ..., "page_number": ...} dicts.
    """
    size = settings.chunk_size
    overlap = settings.chunk_overlap

    if not text.strip():
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) > size and current:
            chunks.append(current.strip())
            current = current[-overlap:] + "\n\n" + para if overlap else para
        else:
            current = (current + "\n\n" + para).strip() if current else para

    if current.strip():
        chunks.append(current.strip())

    # Fallback: character-based split
    if not chunks:
        for i in range(0, len(text), size - overlap):
            chunk = text[i:i + size].strip()
            if chunk:
                chunks.append(chunk)

    # Estimate page numbers (rough: 3000 chars ≈ 1 page)
    chars_per_page = 3000
    running = 0
    result = []
    for chunk in chunks:
        page = max(1, running // chars_per_page + 1)
        result.append({"text": chunk, "page_number": page})
        running += len(chunk)

    return result


def get_file_type(filename: str) -> str:
    return Path(filename).suffix.lower().lstrip(".")
