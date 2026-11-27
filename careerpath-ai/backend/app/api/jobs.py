from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, StudentProfile, JobPosting
from app.services.recommendation_service import recommendation_service
from app.schemas.schemas import JobRecommendationItem
from app.api.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["Intelligent Job Recommendation"])

@router.get("/recommendations", response_model=List[JobRecommendationItem])
def get_recommended_jobs(
    level: Optional[str] = Query(None, description="Experience level: Beginner, Intermediate, Advanced"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    
    return recommendation_service.recommend_jobs(profile, db, level=level)
