import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, upload, chat, documents
from app.services.embedding_service import embedding_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic: Preload embedding model once
    logger.info("Initializing FastAPI Backend Lifespan...")
    try:
        embedding_service.load_model()
    except Exception as e:
        logger.error(f"Failed to preload embedding model during startup: {e}")
    yield
    logger.info("FastAPI Backend Lifespan shutdown complete.")

app = FastAPI(
    title="AI-Assisted RAG Document Reader API",
    description="FastAPI Backend powered by ChromaDB, SentenceTransformers, and Google Gemini 2.0 Flash",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(documents.router)

@app.get("/")
async def root():
    return {
        "message": "AI-Assisted RAG Document Reader API is running.",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
