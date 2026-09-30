from fastapi import APIRouter, Query, HTTPException
from typing import List
from app.models.schemas import DocumentInfo, DeleteDocumentsResponse
from app.services.chroma_service import chroma_service

router = APIRouter(tags=["Documents"])

@router.get("/documents", response_model=List[DocumentInfo])
async def list_documents(collection: str = Query("documents", description="Collection name")):
    try:
        raw_docs = chroma_service.list_documents(collection_name=collection)
        return [
            DocumentInfo(
                name=doc["name"],
                chunk_count=doc["chunk_count"],
                file_hash=doc["file_hash"],
                created_at=doc["created_at"],
                size_bytes=doc["size_bytes"]
            )
            for doc in raw_docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.delete("/documents", response_model=DeleteDocumentsResponse)
async def delete_documents(collection: str = Query("documents", description="Collection name")):
    try:
        deleted_count = chroma_service.delete_all_documents(collection_name=collection)
        return DeleteDocumentsResponse(
            message=f"Successfully deleted all {deleted_count} chunks from collection '{collection}'.",
            deleted_count=deleted_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete documents: {str(e)}")
