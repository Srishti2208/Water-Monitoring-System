import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, StudentProfile, CareerRole
from app.services.recommendation_service import recommendation_service
from app.schemas.schemas import CareerRecommendationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/career", tags=["Career Recommendation Engine"])

@router.get("/roles")
def get_all_career_roles(db: Session = Depends(get_db)):
    """List all available career roles."""
    roles = db.query(CareerRole).all()
    results = []
    for r in roles:
        results.append({
            "id": r.id,
            "slug": r.slug,
            "title": r.title,
            "category": r.category,
            "description": r.description,
            "average_salary": r.average_salary,
            "market_demand": r.market_demand,
            "growth_rate": r.growth_rate,
            "required_skills": json.loads(r.required_skills_json or "[]"),
            "preferred_skills": json.loads(r.preferred_skills_json or "[]"),
            "responsibilities": json.loads(r.responsibilities_json or "[]")
        })
    return results

@router.get("/recommendations", response_model=CareerRecommendationResponse)
def get_career_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found. Please complete profile.")
    
    return recommendation_service.recommenders_with_fallback(profile, db) if hasattr(recommendation_service, "recommenders_with_fallback") else recommendation_service.recommend_careers(profile, db)

@router.post("/compare")
def compare_career_roles(
    payload: Dict[str, List[str]],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    slugs = payload.get("slugs", [])
    if not slugs or len(slugs) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 role slugs to compare.")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    student_skills = set(json.loads(profile.technical_skills_json or "[]")).union(
        set(json.loads(profile.soft_skills_json or "[]"))
    ) if profile else set()

    comparison = []
    for slug in slugs:
        role = db.query(CareerRole).filter(CareerRole.slug == slug).first()
        if not role:
            continue
        req = set(json.loads(role.required_skills_json or "[]"))
        pref = set(json.loads(role.preferred_skills_json or "[]"))
        matched = req.intersection(student_skills)
        missing = req.difference(student_skills)
        score = round((len(matched) / len(req) * 100.0), 1) if req else 50.0

        comparison.append({
            "slug": role.slug,
            "title": role.title,
            "category": role.category,
            "average_salary": role.average_salary,
            "market_demand": role.market_demand,
            "growth_rate": role.growth_rate,
            "suitability_score": score,
            "matched_skills": sorted(list(matched)),
            "missing_skills": sorted(list(missing)),
            "total_skills_required": len(req)
        })

    return {"comparison": comparison}
