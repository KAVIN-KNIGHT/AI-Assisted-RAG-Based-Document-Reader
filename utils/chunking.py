from __future__ import annotations

import re


def clean_text(text: str) -> str:
    """Normalize whitespace and remove stray control characters."""

    text = text.replace("\x00", " ")
    text = re.sub(r"[\t\r\f\v]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s([?.!,;:])", r"\1", text)
    return text.strip()


def split_text_into_chunks(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive.")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and smaller than chunk_size.")

    cleaned_text = clean_text(text)
    if not cleaned_text:
        return []

    chunks: list[str] = []
    step = chunk_size - overlap
    start = 0

    while start < len(cleaned_text):
        end = min(start + chunk_size, len(cleaned_text))
        chunk = cleaned_text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(cleaned_text):
            break
        start += step

    return chunks
