import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
CHROMA_DB_DIR = str(BASE_DIR / "chroma_db")
UPLOADS_DIR = str(BASE_DIR / "uploads")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150

# Ensure required directories exist
os.makedirs(CHROMA_DB_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
