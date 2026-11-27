import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, MockInterviewSession, InterviewQA
from app.services.interview_service import interview_service
from app.schemas.schemas import (
    MockInterviewStartRequest,
    InterviewQuestionItem,
    SubmitAnswerRequest,
    AnswerEvaluationResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/interview", tags=["AI Interview Preparation"])

@router.post("/start")
def start_interview(
    start_in: MockInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = interview_service.start_mock_interview(
        current_user.id,
        start_in.target_role,
        start_in.difficulty,
        db
    )
    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "difficulty": session.difficulty,
        "questions_count": len(session.questions),
        "created_at": session.created_at
    }

@router.get("/{session_id}/questions", response_model=List[InterviewQuestionItem])
def get_session_questions(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(MockInterviewSession).filter(
        MockInterviewSession.id == session_id,
        MockInterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    items = []
    for q in session.questions:
        items.append(InterviewQuestionItem(
            id=q.id,
            question=q.question,
            category=q.category,
            difficulty=q.difficulty,
            model_answer=q.model_answer if q.student_answer else None,
            key_points=json.loads(q.key_points_json or "[]"),
            student_answer=q.student_answer or "",
            score=q.score or 0.0,
            ai_feedback=q.ai_feedback or ""
        ))
    return items

@router.post("/answer", response_model=AnswerEvaluationResponse)
def submit_answer(
    submit_in: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    qa = db.query(InterviewQA).filter(InterviewQA.id == submit_in.question_id).first()
    if not qa or qa.session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Question not found or unauthorized.")
    
    return interview_service.evaluate_answer(submit_in.question_id, submit_in.student_answer, db)

@router.get("/history")
def get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(MockInterviewSession).filter(
        MockInterviewSession.user_id == current_user.id
    ).order_by(MockInterviewSession.created_at.desc()).all()

    results = []
    for s in sessions:
        results.append({
            "session_id": s.id,
            "target_role": s.target_role,
            "difficulty": s.difficulty,
            "total_score": s.total_score,
            "feedback_summary": s.feedback_summary,
            "questions_count": len(s.questions),
            "answered_count": sum(1 for q in s.questions if q.student_answer),
            "created_at": s.created_at
        })
    return results
