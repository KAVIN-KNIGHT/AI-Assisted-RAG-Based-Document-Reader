from __future__ import annotations

from io import BytesIO
from typing import Any

from docx import Document


def extract_text_from_docx(uploaded_file: Any) -> str:
    """Extract text from a DOCX file-like object."""

    try:
        uploaded_file.seek(0)
        document = Document(uploaded_file)
        paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
        return "\n".join(paragraphs)
    except Exception as exc:
        raise ValueError("Invalid DOCX file.") from exc


def extract_text_from_docx_bytes(data: bytes) -> str:
    return extract_text_from_docx(BytesIO(data))
