import os
import time
import logging
from typing import List, Dict, Any, Optional
import numpy as np
import chromadb
from chromadb.config import Settings
from app.config import CHROMA_DB_DIR
from app.models.schemas import SourceItem

logger = logging.getLogger(__name__)

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

class ChromaService:
    _instance: 'ChromaService' = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChromaService, cls).__new__(cls)
            cls._instance.client = chromadb.PersistentClient(
                path=CHROMA_DB_DIR,
                settings=Settings(allow_reset=True, anonymized_telemetry=False)
            )
        return cls._instance

    def get_collection(self, name: str = "documents"):
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )

    def contains_file_hash(self, file_hash: str, collection_name: str = "documents") -> bool:
        collection = self.get_collection(collection_name)
        results = collection.get(where={"file_hash": file_hash}, limit=1)
        return len(results["ids"]) > 0

    def add_chunks(
        self,
        chunks: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str],
        collection_name: str = "documents"
    ) -> None:
        if not chunks:
            return
        collection = self.get_collection(collection_name)
        # Chroma expects ids, embeddings, metadatas, documents
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=chunks
        )

    def search_similar_chunks(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        collection_name: str = "documents",
        score_threshold: float = 0.1,
        use_mmr: bool = True
    ) -> List[SourceItem]:
        collection = self.get_collection(collection_name)
        count = collection.count()
        if count == 0:
            return []

        # Retrieve a larger set of candidates for reranking and MMR
        n_results = min(top_k * 3, count)
        
        query_res = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances", "embeddings"]
        )

        if not query_res or not query_res["ids"] or not query_res["ids"][0]:
            return []

        ids = query_res["ids"][0]
        documents = query_res["documents"][0]
        metadatas = query_res["metadatas"][0]
        distances = query_res["distances"][0] if "distances" in query_res and query_res["distances"] else [0.0] * len(ids)
        candidate_embeddings = query_res["embeddings"][0] if "embeddings" in query_res and query_res["embeddings"] is not None else None

        # Convert distances to similarity scores (for cosine distance: similarity = 1 - distance)
        candidates = []
        seen_snippets = set()

        for idx in range(len(ids)):
            doc = documents[idx]
            meta = metadatas[idx]
            dist = distances[idx]
            # Chroma DB cosine space returns distance between 0 and 2
            similarity = max(0.0, 1.0 - dist)
            
            # Filter duplicates and low scores
            snippet_key = doc.strip().lower()
            if snippet_key in seen_snippets or similarity < score_threshold:
                continue
            seen_snippets.add(snippet_key)

            cand = {
                "id": ids[idx],
                "source": meta.get("source", "Unknown"),
                "score": round(similarity, 4),
                "snippet": doc,
                "chunk_index": meta.get("chunk_index", 0),
                "metadata": meta,
                "embedding": candidate_embeddings[idx] if candidate_embeddings is not None else None
            }
            candidates.append(cand)

        # MMR (Maximum Marginal Relevance) selection if embeddings are present
        if use_mmr and candidate_embeddings is not None and len(candidates) > top_k:
            selected = []
            unselected = list(candidates)
            q_emb = np.array(query_embedding)
            lambda_param = 0.7  # Balance relevance vs diversity

            while len(selected) < top_k and unselected:
                best_score = -float("inf")
                best_idx = 0

                for i, cand in enumerate(unselected):
                    cand_emb = np.array(cand["embedding"])
                    rel_score = cand["score"]

                    # Compute max similarity to already selected candidates
                    if selected:
                        max_sim_to_selected = max(
                            cosine_similarity(cand_emb, np.array(s["embedding"]))
                            for s in selected
                        )
                    else:
                        max_sim_to_selected = 0.0

                    mmr_score = lambda_param * rel_score - (1 - lambda_param) * max_sim_to_selected
                    if mmr_score > best_score:
                        best_score = mmr_score
                        best_idx = i

                selected.append(unselected.pop(best_idx))
            candidates = selected
        else:
            # Sort by similarity score descending
            candidates.sort(key=lambda x: x["score"], reverse=True)
            candidates = candidates[:top_k]

        return [
            SourceItem(
                id=c["id"],
                source=c["source"],
                score=c["score"],
                snippet=c["snippet"],
                chunk_index=c["chunk_index"],
                metadata=c["metadata"]
            )
            for c in candidates
        ]

    def list_documents(self, collection_name: str = "documents") -> List[Dict[str, Any]]:
        collection = self.get_collection(collection_name)
        data = collection.get(include=["metadatas"])
        if not data or not data["metadatas"]:
            return []

        doc_map: Dict[str, Dict[str, Any]] = {}
        for meta in data["metadatas"]:
            source = meta.get("source", "Unknown")
            file_hash = meta.get("file_hash", "")
            created_at = meta.get("created_at", "")
            size_bytes = meta.get("size_bytes", 0)

            if source not in doc_map:
                doc_map[source] = {
                    "name": source,
                    "chunk_count": 0,
                    "file_hash": file_hash,
                    "created_at": created_at,
                    "size_bytes": size_bytes
                }
            doc_map[source]["chunk_count"] += 1

        return list(doc_map.values())

    def delete_all_documents(self, collection_name: str = "documents") -> int:
        collection = self.get_collection(collection_name)
        count = collection.count()
        if count > 0:
            self.client.delete_collection(name=collection_name)
            # Recreate empty collection
            self.get_collection(collection_name)
        return count

    def get_stats(self, collection_name: str = "documents") -> Dict[str, Any]:
        collection = self.get_collection(collection_name)
        total_chunks = collection.count()
        docs = self.list_documents(collection_name)

        db_size_bytes = 0
        if os.path.exists(CHROMA_DB_DIR):
            for root, _, files in os.walk(CHROMA_DB_DIR):
                for f in files:
                    db_size_bytes += os.path.getsize(os.path.join(root, f))

        db_size_mb = round(db_size_bytes / (1024 * 1024), 2)

        return {
            "total_documents": len(docs),
            "total_chunks": total_chunks,
            "db_size_mb": db_size_mb,
            "chroma_dir": CHROMA_DB_DIR
        }

chroma_service = ChromaService()
