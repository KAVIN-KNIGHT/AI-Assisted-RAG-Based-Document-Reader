import time
import logging
from typing import List
from sentence_transformers import SentenceTransformer
from app.config import EMBEDDING_MODEL_NAME

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance: 'EmbeddingService' = None
    model: SentenceTransformer = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        if self.model is None:
            logger.info(f"Loading SentenceTransformer model '{EMBEDDING_MODEL_NAME}' into memory...")
            start_time = time.time()
            self.model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            elapsed = time.time() - start_time
            logger.info(f"Embedding model loaded successfully in {elapsed:.2f} seconds.")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if self.model is None:
            self.load_model()
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        if self.model is None:
            self.load_model()
        embedding = self.model.encode(query, convert_to_numpy=True, show_progress_bar=False)
        return embedding.tolist()

embedding_service = EmbeddingService()
