from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"
FALLBACK_GEMINI_MODELS = (
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
)


@dataclass(slots=True)
class LlmResponse:
    answer: str


def _build_prompt(question: str, context_chunks: list[str]) -> str:
    context = "\n\n".join(context_chunks)
    return (
        "You are a helpful document assistant. Answer the question using only the context below. "
        "If the answer is not present, say that you could not find it in the provided documents.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    )


def _normalize_gemini_error(exc: Exception) -> ValueError:
    message = str(exc)
    lowered = message.lower()

    if "quota" in lowered or "429" in lowered or "resourceexhausted" in lowered:
        return ValueError(
            "Gemini quota was exceeded for this API key/model. Check billing or switch to a key/project with available quota."
        )

    if "api key not valid" in lowered or "permission" in lowered or "unauthorized" in lowered:
        return ValueError("Gemini API key is invalid or does not have permission to use the selected model.")

    return ValueError(f"Gemini request failed: {message}")


@lru_cache(maxsize=8)
def _resolve_model_name(api_key: str, preferred_model: str | None) -> str:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    available_models = [
        model.name.removeprefix("models/")
        for model in genai.list_models()
        if "generateContent" in getattr(model, "supported_generation_methods", [])
    ]

    candidates: list[str] = []
    if preferred_model:
        candidates.append(preferred_model)
    candidates.extend(model for model in FALLBACK_GEMINI_MODELS if model not in candidates)

    for candidate in candidates:
        if candidate in available_models:
            return candidate

    if available_models:
        return available_models[0]

    raise ValueError("No Gemini models with generateContent support are available for this API key.")


def _call_gemini(prompt: str, api_key: str, preferred_model: str | None) -> str:
    import google.generativeai as genai

    try:
        model_name = _resolve_model_name(api_key, preferred_model)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return getattr(response, "text", "").strip()
    except Exception as exc:
        raise _normalize_gemini_error(exc) from exc


def generate_answer(
    question: str,
    context_chunks: list[str],
) -> LlmResponse:
    prompt = _build_prompt(question, context_chunks)

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY. Add it to the .env file in the project folder.")

    preferred_model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip() or None
    answer = _call_gemini(prompt, api_key, preferred_model)
    return LlmResponse(answer=answer or "No answer was returned by Gemini.")
