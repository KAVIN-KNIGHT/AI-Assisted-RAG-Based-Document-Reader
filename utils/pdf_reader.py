from __future__ import annotations

from io import BytesIO
from typing import Any

from PyPDF2 import PdfReader


def extract_text_from_pdf(uploaded_file: Any) -> str:
    """Extract text from a PDF file-like object."""

    try:
        uploaded_file.seek(0)
        reader = PdfReader(uploaded_file)
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    except Exception as exc:
        raise ValueError("Invalid PDF file.") from exc


def extract_text_from_pdf_bytes(data: bytes) -> str:
    return extract_text_from_pdf(BytesIO(data))
