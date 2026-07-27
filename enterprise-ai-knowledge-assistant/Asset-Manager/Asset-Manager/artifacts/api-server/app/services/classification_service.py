"""Document classification, topic extraction, and duplicate detection."""
import re
from typing import List, Optional, Tuple
from collections import Counter

# Category keyword mapping
CATEGORY_KEYWORDS = {
    "HR": [
        "employee", "salary", "benefits", "leave", "performance", "recruitment",
        "onboarding", "payroll", "hr", "human resources", "vacation", "training",
        "termination", "hiring", "interview", "compensation",
    ],
    "Finance": [
        "revenue", "budget", "expense", "invoice", "payment", "financial",
        "accounting", "balance sheet", "profit", "loss", "cash flow", "tax",
        "audit", "forecast", "quarter", "fiscal", "roi", "ebitda",
    ],
    "Legal": [
        "contract", "agreement", "terms", "conditions", "liability", "compliance",
        "regulation", "law", "legal", "clause", "patent", "intellectual property",
        "litigation", "counsel", "jurisdiction", "indemnity", "warranty",
    ],
    "Engineering": [
        "api", "software", "system", "architecture", "database", "code",
        "deployment", "infrastructure", "technical", "specification", "design",
        "algorithm", "server", "network", "security", "protocol", "development",
    ],
    "Marketing": [
        "campaign", "brand", "marketing", "customer", "audience", "strategy",
        "social media", "content", "seo", "analytics", "lead", "conversion",
        "advertising", "market", "promotion", "engagement", "funnel",
    ],
}

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "we", "our", "you", "your", "they", "their", "he", "she", "his", "her",
    "not", "also", "more", "than", "as", "if", "so", "up", "out", "all",
}


def classify_document(text: str) -> str:
    """Classify a document into a category based on keyword frequency."""
    text_lower = text.lower()
    scores: dict[str, int] = {cat: 0 for cat in CATEGORY_KEYWORDS}

    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            scores[category] += text_lower.count(kw)

    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "General"


def extract_topics(text: str, n: int = 10) -> List[str]:
    """Extract top N keywords from text as topic tags."""
    # Tokenise and filter
    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
    filtered = [w for w in words if w not in STOPWORDS]
    counts = Counter(filtered)

    # Return top-n by frequency
    return [word for word, _ in counts.most_common(n)]


def compute_text_hash(text: str) -> str:
    """Compute a stable hash of normalised text for duplicate detection."""
    import hashlib
    normalised = re.sub(r"\s+", " ", text.lower().strip())
    return hashlib.sha256(normalised.encode()).hexdigest()


def is_duplicate(text: str, existing_hashes: List[str]) -> bool:
    """Return True if this text hash already exists in the list."""
    h = compute_text_hash(text)
    return h in existing_hashes
