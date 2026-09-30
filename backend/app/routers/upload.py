import hashlib
import time
import uuid
import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.models.schemas import UploadResponse, DocumentInfo
from app.services.doc_parser import extract_document_text
from app.services.chunker import chunker_service
from app.services.embedding_service import embedding_service
from app.services.chroma_service import chroma_service
from app.config import MAX_UPLOAD_SIZE_MB

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Upload"])

@router.post("/upload", response_model=UploadResponse)
async def upload_documents(
    files: List[UploadFile] = File(...),
    collection_name: str = Form("documents")
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for upload.")

    documents_info: List[DocumentInfo] = []
    skipped: List[str] = []
    errors: List[str] = []
    new_chunks_count = 0

    all_chunks: List[str] = []
    all_embeddings: List[List[float]] = []
    all_metadatas: List[dict] = []
    all_ids: List[str] = []

    for file in files:
        filename = file.filename
        lower_name = filename.lower()
        if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx")):
            errors.append(f"'{filename}' skipped: Only PDF and DOCX files are allowed.")
            continue

        try:
            content = await file.read()
            size_bytes = len(content)
            size_mb = size_bytes / (1024 * 1024)

            if size_mb > MAX_UPLOAD_SIZE_MB:
                errors.append(f"'{filename}' skipped: File size ({size_mb:.1f} MB) exceeds {MAX_UPLOAD_SIZE_MB} MB limit.")
                continue

            file_hash = hashlib.sha256(content).hexdigest()

            # Check if file was already indexed
            if chroma_service.contains_file_hash(file_hash, collection_name=collection_name):
                skipped.append(f"'{filename}' was already indexed and skipped.")
                continue

            # Extract text
            cleaned_text = extract_document_text(filename, content)
            if not cleaned_text.strip():
                errors.append(f"'{filename}' skipped: No readable text extracted from document.")
                continue

            # Split text into chunks
            chunks = chunker_service.split_text(cleaned_text)
            if not chunks:
                errors.append(f"'{filename}' skipped: Document could not be divided into text chunks.")
                continue

            # Generate embeddings
            embeddings = embedding_service.embed_texts(chunks)
            created_at = datetime.utcnow().isoformat()

            # Prepare IDs & Metadatas for Chroma
            for idx, chunk in enumerate(chunks):
                chunk_id = f"{file_hash}_{idx}_{uuid.uuid4().hex[:8]}"
                metadata = {
                    "source": filename,
                    "file_hash": file_hash,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "created_at": created_at,
                    "size_bytes": size_bytes
                }
                all_ids.append(chunk_id)
                all_chunks.append(chunk)
                all_metadatas.append(metadata)

            all_embeddings.extend(embeddings)

            documents_info.append(
                DocumentInfo(
                    name=filename,
                    chunk_count=len(chunks),
                    file_hash=file_hash,
                    created_at=created_at,
                    size_bytes=size_bytes
                )
            )
            new_chunks_count += len(chunks)

        except Exception as e:
            logger.error(f"Error processing file {filename}: {e}")
            errors.append(f"'{filename}' processing error: {str(e)}")

    # Add all accumulated chunks into ChromaDB
    if all_chunks:
        chroma_service.add_chunks(
            chunks=all_chunks,
            embeddings=all_embeddings,
            metadatas=all_metadatas,
            ids=all_ids,
            collection_name=collection_name
        )

    stats = chroma_service.get_stats(collection_name=collection_name)

    msg = f"Successfully indexed {new_chunks_count} chunk(s) from {len(documents_info)} document(s)."
    if errors:
        msg += f" {len(errors)} error(s) occurred."

    return UploadResponse(
        documents=documents_info,
        indexed_chunks=new_chunks_count,
        total_chunks=stats["total_chunks"],
        total_documents=stats["total_documents"],
        skipped=skipped,
        errors=errors,
        message=msg
    )
