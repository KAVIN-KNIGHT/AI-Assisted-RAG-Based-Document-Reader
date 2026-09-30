from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import CHUNK_SIZE, CHUNK_OVERLAP

class TextChunker:
    def __init__(self, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            keep_separator=True
        )

    def split_text(self, text: str) -> List[str]:
        if not text.strip():
            return []
        chunks = self.splitter.split_text(text)
        return [c.strip() for c in chunks if c.strip()]

chunker_service = TextChunker()
