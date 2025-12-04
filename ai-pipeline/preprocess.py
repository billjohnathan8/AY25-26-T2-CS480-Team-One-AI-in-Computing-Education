from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class PreprocessedText:
    original: str
    cleaned: str
    token_count: int


def clean_text(text: str, max_tokens: int = 900) -> PreprocessedText:
    normalized = text.lower()
    normalized = re.sub(r"\s+", " ", normalized).strip()
    tokens = normalized.split(" ")
    if len(tokens) > max_tokens:
        tokens = tokens[:max_tokens]
    cleaned = " ".join(tokens)
    return PreprocessedText(original=text, cleaned=cleaned, token_count=len(tokens))
