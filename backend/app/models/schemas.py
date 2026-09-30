from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    question: str = Field(..., description="User's query string", min_length=1)
    collection_name: Optional[str] = Field("documents", description="Chroma collection name")
    top_k: Optional[int] = Field(5, description="Number of top context chunks to retrieve")

class SourceItem(BaseModel):
    id: str
    source: str
    score: float
    snippet: str
    chunk_index: int
    metadata: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    search_latency_ms: float
    answer_latency_ms: float
    total_latency_ms: float

class DocumentInfo(BaseModel):
    name: str
    chunk_count: int
    file_hash: str
    created_at: str
    size_bytes: int

class UploadResponse(BaseModel):
    documents: List[DocumentInfo]
    indexed_chunks: int
    total_chunks: int
    total_documents: int
    skipped: List[str] = []
    errors: List[str] = []
    message: str

class DeleteDocumentsResponse(BaseModel):
    message: str
    deleted_count: int

class HealthResponse(BaseModel):
    status: str
    embedding_model_loaded: bool
    gemini_configured: bool
    vector_db_connected: bool
    total_documents: int
    total_chunks: int

class StatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    db_size_mb: float
    embedding_model: str
    llm_model: str
    chroma_dir: str
