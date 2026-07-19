from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from utils.chunking import clean_text, split_text_into_chunks
from utils.doc_reader import extract_text_from_docx
from utils.embedding import MODEL_NAME, embed_query, embed_texts
from utils.llm import LlmResponse, generate_answer
from utils.pdf_reader import extract_text_from_pdf
from utils.vector_store import ChunkRecord, LocalFAISSStore, SearchResult


@dataclass(slots=True)
class AnswerBundle:
    answer: str
    sources: list[SearchResult]


class RagPipeline:
    def __init__(self, storage_dir: Path) -> None:
        self.storage_dir = storage_dir
        self.vector_store = LocalFAISSStore(storage_dir=storage_dir)

    def _file_bytes(self, uploaded_file: Any) -> bytes:
        uploaded_file.seek(0)
        return uploaded_file.getvalue()

    def _file_hash(self, file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    def _extract_text(self, uploaded_file: Any) -> str:
        filename = uploaded_file.name.lower()
        if filename.endswith(".pdf"):
            return extract_text_from_pdf(uploaded_file)
        if filename.endswith(".docx"):
            return extract_text_from_docx(uploaded_file)
        raise ValueError("Unsupported file type. Only PDF and DOCX files are supported.")

    def ingest_files(self, uploaded_files: list[Any], max_upload_mb: int = 25) -> dict[str, Any]:
        documents: list[dict[str, Any]] = []
        errors: list[str] = []
        skipped: list[str] = []
        all_embeddings = []
        all_records: list[ChunkRecord] = []

        for uploaded_file in uploaded_files:
            file_size_mb = getattr(uploaded_file, "size", 0) / (1024 * 1024)
            if file_size_mb > max_upload_mb:
                errors.append(f"{uploaded_file.name} exceeds the {max_upload_mb} MB upload limit.")
                continue

            file_bytes = self._file_bytes(uploaded_file)
            file_hash = self._file_hash(file_bytes)

            if self.vector_store.contains_file_hash(file_hash):
                skipped.append(f"{uploaded_file.name} was already indexed and was skipped.")
                continue

            try:
                raw_text = self._extract_text(uploaded_file)
                cleaned_text = clean_text(raw_text)
                if not cleaned_text:
                    errors.append(f"{uploaded_file.name} is empty after text extraction.")
                    continue

                chunks = split_text_into_chunks(cleaned_text, chunk_size=500, overlap=100)
                if not chunks:
                    errors.append(f"{uploaded_file.name} could not be split into chunks.")
                    continue

                embeddings = embed_texts(chunks, model_name=MODEL_NAME)
                chunk_records = [
                    ChunkRecord(
                        source=uploaded_file.name,
                        text=chunk,
                        file_hash=file_hash,
                        chunk_index=index,
                    )
                    for index, chunk in enumerate(chunks)
                ]
                all_embeddings.append(embeddings)
                all_records.extend(chunk_records)
                documents.append({"name": uploaded_file.name, "chunks": len(chunks)})
            except ValueError as exc:
                errors.append(f"{uploaded_file.name}: {exc}")

        indexed_chunks = 0
        if all_embeddings:
            stacked_embeddings = np.vstack(all_embeddings)
            self.vector_store.add(stacked_embeddings, all_records)
            indexed_chunks = len(all_records)

        stats = self.vector_store.stats()
        return {
            "documents": documents,
            "errors": errors,
            "skipped": skipped,
            "indexed_chunks": indexed_chunks,
            "total_chunks": stats["chunks"],
            "total_documents": stats["documents"],
        }

    def answer_question(self, question: str) -> AnswerBundle:
        query_embedding = embed_query(question, model_name=MODEL_NAME)
        retrieved_chunks = self.vector_store.search(query_embedding, top_k=5)

        if not retrieved_chunks:
            return AnswerBundle(
                answer="No indexed document content is available yet. Upload and process documents first.",
                sources=[],
            )

        context_chunks = [
            f"Source: {result.source}\nContent: {result.text}"
            for result in retrieved_chunks
        ]
        llm_response: LlmResponse = generate_answer(
            question=question,
            context_chunks=context_chunks,
        )
        return AnswerBundle(answer=llm_response.answer, sources=retrieved_chunks)
