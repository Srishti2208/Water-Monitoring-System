from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, RAGDocument
from app.services.rag_service import rag_service
from app.schemas.schemas import RAGQueryRequest, RAGQueryResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/rag", tags=["RAG-Based Career Assistant"])

@router.post("/query", response_model=RAGQueryResponse)
def query_career_assistant(
    query_in: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not query_in.question.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    return rag_service.answer_query(db, query_in.question, query_in.conversation_history)

@router.get("/documents")
def list_knowledge_documents(db: Session = Depends(get_db)):
    """List available documents in the verified RAG knowledge base."""
    docs = db.query(RAGDocument).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "source_filename": d.source_filename,
            "chunk_count": d.chunk_count,
            "created_at": d.created_at
        }
        for d in docs
    ]
