export interface SourceItem {
  id: string;
  source: string;
  score: number;
  snippet: string;
  chunk_index: number;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
  timestamp: string;
  search_latency_ms?: number;
  answer_latency_ms?: number;
  total_latency_ms?: number;
  isError?: boolean;
}

export interface DocumentInfo {
  name: string;
  chunk_count: number;
  file_hash: string;
  created_at: string;
  size_bytes: number;
}

export interface UploadResponse {
  documents: DocumentInfo[];
  indexed_chunks: number;
  total_chunks: number;
  total_documents: number;
  skipped: string[];
  errors: string[];
  message: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceItem[];
  search_latency_ms: number;
  answer_latency_ms: number;
  total_latency_ms: number;
}

export interface HealthResponse {
  status: string;
  embedding_model_loaded: boolean;
  gemini_configured: boolean;
  vector_db_connected: boolean;
  total_documents: number;
  total_chunks: number;
}

export interface StatsResponse {
  total_documents: number;
  total_chunks: number;
  db_size_mb: number;
  embedding_model: string;
  llm_model: string;
  chroma_dir: string;
}
