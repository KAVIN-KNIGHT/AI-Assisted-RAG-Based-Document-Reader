from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import faiss
import numpy as np


@dataclass(slots=True)
class ChunkRecord:
    source: str
    text: str
    file_hash: str
    chunk_index: int


@dataclass(slots=True)
class SearchResult:
    source: str
    snippet: str
    score: float
    text: str


class LocalFAISSStore:
    def __init__(self, storage_dir: Path, dimension: int = 384) -> None:
        self.storage_dir = storage_dir
        self.index_path = self.storage_dir / "index.faiss"
        self.metadata_path = self.storage_dir / "metadata.json"
        self.dimension = dimension
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index = self._load_index()
        self.records = self._load_records()

    def _empty_index(self) -> faiss.Index:
        return faiss.IndexFlatIP(self.dimension)

    def _load_index(self) -> faiss.Index:
        if self.index_path.exists():
            return faiss.read_index(str(self.index_path))
        return self._empty_index()

    def _load_records(self) -> list[dict[str, Any]]:
        if self.metadata_path.exists():
            with self.metadata_path.open("r", encoding="utf-8") as handle:
                return json.load(handle)
        return []

    def _save(self) -> None:
        faiss.write_index(self.index, str(self.index_path))
        with self.metadata_path.open("w", encoding="utf-8") as handle:
            json.dump(self.records, handle, ensure_ascii=False, indent=2)

    def contains_file_hash(self, file_hash: str) -> bool:
        return any(record["file_hash"] == file_hash for record in self.records)

    def add(self, embeddings: np.ndarray, chunk_records: list[ChunkRecord]) -> None:
        if embeddings.size == 0:
            return

        if embeddings.shape[1] != self.dimension:
            raise ValueError(f"Expected embeddings with dimension {self.dimension}, got {embeddings.shape[1]}.")

        self.index.add(np.asarray(embeddings, dtype="float32"))
        self.records.extend(asdict(record) for record in chunk_records)
        self._save()

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> list[SearchResult]:
        if self.index.ntotal == 0:
            return []

        scores, indices = self.index.search(np.asarray(query_embedding, dtype="float32"), top_k)
        results: list[SearchResult] = []
        for score, index in zip(scores[0], indices[0], strict=False):
            if index < 0 or index >= len(self.records):
                continue
            record = self.records[index]
            snippet = record["text"][:300]
            results.append(
                SearchResult(
                    source=record["source"],
                    snippet=snippet,
                    score=float(score),
                    text=record["text"],
                )
            )
        return results

    def stats(self) -> dict[str, int]:
        return {
            "chunks": len(self.records),
            "documents": len({record["file_hash"] for record in self.records}),
        }
