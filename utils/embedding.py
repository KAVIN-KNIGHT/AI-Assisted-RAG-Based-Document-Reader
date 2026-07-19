from __future__ import annotations

from functools import lru_cache
from typing import Iterable

import numpy as np
from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model(model_name: str = MODEL_NAME) -> SentenceTransformer:
    return SentenceTransformer(model_name)


def embed_texts(texts: Iterable[str], model_name: str = MODEL_NAME) -> np.ndarray:
    model = get_embedding_model(model_name)
    embeddings = model.encode(list(texts), normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(embeddings, dtype="float32")


def embed_query(text: str, model_name: str = MODEL_NAME) -> np.ndarray:
    model = get_embedding_model(model_name)
    embedding = model.encode([text], normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(embedding, dtype="float32")
