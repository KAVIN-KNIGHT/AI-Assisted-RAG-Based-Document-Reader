from fastapi import APIRouter
from app.models.schemas import HealthResponse, StatsResponse
from app.services.embedding_service import embedding_service
from app.services.chroma_service import chroma_service
from app.config import GEMINI_API_KEY, EMBEDDING_MODEL_NAME, GEMINI_MODEL

router = APIRouter(tags=["Health & Stats"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    stats = chroma_service.get_stats()
    gemini_configured = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
    embedding_loaded = embedding_service.model is not None

    return HealthResponse(
        status="healthy",
        embedding_model_loaded=embedding_loaded,
        gemini_configured=gemini_configured,
        vector_db_connected=True,
        total_documents=stats["total_documents"],
        total_chunks=stats["total_chunks"]
    )

@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    stats = chroma_service.get_stats()
    return StatsResponse(
        total_documents=stats["total_documents"],
        total_chunks=stats["total_chunks"],
        db_size_mb=stats["db_size_mb"],
        embedding_model=EMBEDDING_MODEL_NAME,
        llm_model=GEMINI_MODEL,
        chroma_dir=stats["chroma_dir"]
    )
