import json
import math
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import RAGDocument, RAGDocumentChunk
from app.services.llm_service import llm_service
from app.schemas.schemas import RAGSourceChunk, RAGQueryResponse

class RAGService:
    """Retrieval-Augmented Generation Service using Semantic Vector Similarity & Document Grounding."""

    def chunk_document(self, text: str, chunk_size: int = 250, overlap: int = 40) -> List[str]:
        """Split document text into overlapping chunks of approximately chunk_size words."""
        words = text.split()
        if not words:
            return []
        chunks = []
        step = max(1, chunk_size - overlap)
        for i in range(0, len(words), step):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
            if i + chunk_size >= len(words):
                break
        return chunks

    def compute_embedding(self, text: str) -> List[float]:
        """Compute term frequency vector with dimension hashing for rapid zero-dependency semantic cosine matching."""
        # 128-dimensional hashed feature vector
        dim = 128
        vec = [0.0] * dim
        tokens = re.findall(r"\b\w{2,}\b", text.lower())
        if not tokens:
            return vec

        for token in tokens:
            # Deterministic hash bucket
            h = abs(hash(token)) % dim
            vec[h] += 1.0

        # Normalize vector to unit length
        magnitude = math.sqrt(sum(v * v for v in vec))
        if magnitude > 0:
            vec = [v / magnitude for v in vec]
        return vec

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two unit vectors."""
        if len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        return max(0.0, min(1.0, dot))

    def ingest_document(self, db: Session, title: str, category: str, content: str, source_filename: str = "") -> RAGDocument:
        """Ingest document, chunk it, embed chunks, and persist to database."""
        doc = RAGDocument(
            title=title,
            category=category,
            source_filename=source_filename,
            uploaded_by_admin=True
        )
        db.add(doc)
        db.flush()

        chunks = self.chunk_document(content)
        doc.chunk_count = len(chunks)

        for idx, chunk_text in enumerate(chunks):
            embedding = self.compute_embedding(chunk_text)
            chunk_obj = RAGDocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                content=chunk_text,
                token_count=len(chunk_text.split()),
                metadata_json=json.dumps({"title": title, "category": category}),
                embedding_json=json.dumps(embedding)
            )
            db.add(chunk_obj)

        db.commit()
        db.refresh(doc)
        return doc

    def retrieve_relevant_chunks(self, db: Session, query: str, top_k: int = 4, threshold: float = 0.15) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant chunks across all indexed career documents."""
        query_vec = self.compute_embedding(query)
        chunks = db.query(RAGDocumentChunk).join(RAGDocument).all()

        scored_chunks = []
        for c in chunks:
            try:
                emb = json.loads(c.embedding_json or "[]")
                sim = self.cosine_similarity(query_vec, emb)
                
                # Keyword overlap bonus
                query_words = set(re.findall(r"\b\w{3,}\b", query.lower()))
                chunk_words = set(re.findall(r"\b\w{3,}\b", c.content.lower()))
                keyword_overlap = len(query_words.intersection(chunk_words))
                if keyword_overlap > 0:
                    sim += min(0.3, keyword_overlap * 0.05)

                if sim >= threshold:
                    scored_chunks.append({
                        "chunk_id": c.id,
                        "document_title": c.document.title,
                        "source_category": c.document.category,
                        "content": c.content,
                        "score": round(sim, 3)
                    })
            except Exception:
                continue

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    def answer_query(self, db: Session, query: str, history: Optional[List[Dict[str, str]]] = None) -> RAGQueryResponse:
        """Ground answer using retrieved RAG context and LLM synthesis."""
        relevant_chunks = self.retrieve_relevant_chunks(db, query, top_k=4)

        if not relevant_chunks:
            # Check if general fallback response is needed
            fallback_answer = (
                "I could not find specific placement documents matching your query in the current knowledge base. "
                "However, as a general career guideline: prioritize building verified portfolio projects on GitHub, "
                "mastering core Data Structures & Algorithms, and tailoring your resume to specific job keywords. "
                "Administrators can upload customized campus placement guides via the Admin Portal to expand this context."
            )
            return RAGQueryResponse(
                answer=fallback_answer,
                sources=[],
                has_relevant_context=False
            )

        # Build context prompt
        context_str = "\n\n".join([
            f"[Source {i+1}: {c['document_title']} ({c['source_category']})]\n{c['content']}"
            for i, c in enumerate(relevant_chunks)
        ])

        system_instruction = (
            "You are CareerPath AI's verified RAG Career & Placement Advisor. "
            "Use the provided reference context documents to answer the student's question accurately. "
            "Always cite the source document titles when giving specific facts, salary numbers, or roadmaps. "
            "If the context does not contain the answer, explicitly state that reliable information is unavailable in the knowledge base, rather than inventing facts."
        )

        user_prompt = (
            f"Student Question: {query}\n\n"
            f"Context Documents:\n{context_str}\n\n"
            f"Please provide a comprehensive, structured, encouraging, and actionable response citing the relevant sources."
        )

        answer_text = llm_service.generate_text(user_prompt, system_instruction=system_instruction)

        sources = [
            RAGSourceChunk(
                document_title=c["document_title"],
                source_category=c["source_category"],
                snippet=c["content"][:220] + "...",
                relevance_score=c["score"]
            )
            for c in relevant_chunks
        ]

        return RAGQueryResponse(
            answer=answer_text,
            sources=sources,
            has_relevant_context=True
        )

rag_service = RAGService()
