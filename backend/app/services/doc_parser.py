import re
import io
import logging
from pypdf import PdfReader
import docx

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Normalize carriage returns and non-breaking spaces
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")
    # Replace multiple spaces while keeping double linebreaks for paragraph boundaries
    lines = [line.strip() for line in text.split("\n")]
    # Join non-empty lines with single newline or paragraph breaks
    cleaned = "\n".join(line for line in lines if line)
    return cleaned

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        pages_text = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                pages_text.append(page_text)
        return "\n\n".join(pages_text)
    except Exception as e:
        logger.error(f"Error parsing PDF file: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        docx_file = io.BytesIO(file_bytes)
        document = docx.Document(docx_file)
        paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        logger.error(f"Error parsing DOCX file: {e}")
        raise ValueError(f"Failed to parse DOCX: {str(e)}")

def extract_document_text(filename: str, file_bytes: bytes) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        raw_text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX files are allowed.")
    
    return clean_text(raw_text)
