import time
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.embedding_service import embedding_service
from app.services.chroma_service import chroma_service
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    total_start = time.time()

    # Step 1: Embed query and perform MMR similarity search
    search_start = time.time()
    query_embedding = embedding_service.embed_query(request.question)
    sources = chroma_service.search_similar_chunks(
        query_embedding=query_embedding,
        top_k=request.top_k or 5,
        collection_name=request.collection_name or "documents",
        use_mmr=True
    )
    search_latency_ms = (time.time() - search_start) * 1000

    # Step 2: Generate LLM RAG response using Gemini
    answer, llm_latency_ms = llm_service.generate_rag_answer(
        question=request.question,
        sources=sources
    )

    total_latency_ms = (time.time() - total_start) * 1000

    return ChatResponse(
        answer=answer,
        sources=sources,
        search_latency_ms=round(search_latency_ms, 2),
        answer_latency_ms=round(llm_latency_ms, 2),
        total_latency_ms=round(total_latency_ms, 2)
    )
