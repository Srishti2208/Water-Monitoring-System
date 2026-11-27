from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, StudentProfile
from app.services.recommendation_service import recommendation_service
from app.schemas.schemas import SkillGapReport
from app.api.deps import get_current_user

router = APIRouter(prefix="/skills", tags=["AI Skill Gap Analysis"])

@router.get("/gap/{role_slug}", response_model=SkillGapReport)
def get_skill_gap_report(
    role_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    
    try:
        return recommendation_service.analyze_skill_gap(role_slug, profile, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
