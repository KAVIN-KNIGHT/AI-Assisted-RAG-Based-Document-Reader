from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
import streamlit as st

from utils.rag_pipeline import RagPipeline


APP_TITLE = "AI-Assisted RAG-Based Document Reader"
APP_SUBTITLE = "Upload PDFs or DOCX files, ask questions, and get context-aware answers from your documents."
VECTOR_STORE_DIR = Path("data/vector_store")
MAX_UPLOAD_MB = 25
DOTENV_PATH = Path(__file__).resolve().with_name(".env")


def _init_session_state() -> None:
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    if "pipeline" not in st.session_state:
        st.session_state.pipeline = RagPipeline(storage_dir=VECTOR_STORE_DIR)
    if "ingested_files" not in st.session_state:
        st.session_state.ingested_files = []
    if "last_ingest_summary" not in st.session_state:
        st.session_state.last_ingest_summary = None


def _sidebar_controls() -> None:
    st.sidebar.header("Controls")
    st.sidebar.caption(f"Upload limit: {MAX_UPLOAD_MB} MB per file")
    st.sidebar.caption("Uses GEMINI_API_KEY and GEMINI_MODEL from .env in the project folder.")

    if st.sidebar.button("Clear chat"):
        st.session_state.chat_history = []
        st.rerun()


def _render_uploaded_files() -> None:
    ingested_files = st.session_state.get("ingested_files", [])
    if not ingested_files:
        st.info("No documents have been indexed yet.")
        return

    st.subheader("Indexed Documents")
    for item in ingested_files:
        st.write(f"- {item['name']} ({item['chunks']} chunks)")


def _render_chat_history() -> None:
    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message["role"] == "assistant" and message.get("sources"):
                with st.expander("Retrieved sources", expanded=False):
                    for source in message["sources"]:
                        st.markdown(
                            f"**{source['source']}**\n\nSimilarity: `{source['score']:.3f}`\n\n{source['snippet']}"
                        )


def main() -> None:
    load_dotenv(DOTENV_PATH)
    st.set_page_config(page_title=APP_TITLE, page_icon="📄", layout="wide")
    _init_session_state()

    st.title(APP_TITLE)
    st.caption(APP_SUBTITLE)

    _sidebar_controls()
    pipeline: RagPipeline = st.session_state.pipeline

    st.subheader("Upload Documents")
    uploaded_files = st.file_uploader(
        "Add PDF or DOCX documents",
        type=["pdf", "docx"],
        accept_multiple_files=True,
    )

    if uploaded_files:
        st.write("Uploaded files:")
        for uploaded_file in uploaded_files:
            st.write(f"- {uploaded_file.name}")

        if st.button("Process documents"):
            with st.spinner("Indexing documents..."):
                result = pipeline.ingest_files(uploaded_files, max_upload_mb=MAX_UPLOAD_MB)
                st.session_state.ingested_files = result["documents"]
                st.session_state.last_ingest_summary = result

                for error in result["errors"]:
                    st.warning(error)
                for skipped in result["skipped"]:
                    st.info(skipped)

                if result["documents"]:
                    st.success(
                        f"Indexed {result['indexed_chunks']} chunks from {len(result['documents'])} document(s)."
                    )

    _render_uploaded_files()

    if st.session_state.last_ingest_summary:
        summary = st.session_state.last_ingest_summary
        st.caption(
            f"Vector store contains {summary['total_chunks']} chunk(s) from {summary['total_documents']} document(s)."
        )

    _render_chat_history()

    prompt = st.chat_input("Ask a question about your uploaded documents")
    if prompt:
        st.session_state.chat_history.append({"role": "user", "content": prompt})

        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            try:
                with st.spinner("Generating answer..."):
                    answer = pipeline.answer_question(prompt)

                st.markdown(answer.answer)
                if answer.sources:
                    with st.expander("Retrieved sources", expanded=False):
                        for source in answer.sources:
                            st.markdown(
                                f"**{source.source}**\n\nSimilarity: `{source.score:.3f}`\n\n{source.snippet}"
                            )
                else:
                    st.caption("No supporting sources were retrieved.")

                st.session_state.chat_history.append(
                    {
                        "role": "assistant",
                        "content": answer.answer,
                        "sources": [
                            {
                                "source": source.source,
                                "score": source.score,
                                "snippet": source.snippet,
                            }
                            for source in answer.sources
                        ],
                    }
                )
            except ValueError as exc:
                error_message = str(exc)
                st.error(error_message)
                st.session_state.chat_history.append({"role": "assistant", "content": error_message})
            except Exception as exc:
                error_message = f"Unexpected error while generating the answer: {exc}"
                st.error(error_message)
                st.session_state.chat_history.append({"role": "assistant", "content": error_message})


if __name__ == "__main__":
    main()
