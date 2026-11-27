import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, StudentProfile
from app.schemas.schemas import ProfileUpdate, ProfileResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Student Profile"])

def format_profile_response(profile: StudentProfile) -> ProfileResponse:
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        university=profile.university or "",
        degree=profile.degree or "",
        specialization=profile.specialization or "",
        graduation_year=profile.graduation_year,
        cgpa=profile.cgpa or 0.0,
        technical_skills=json.loads(profile.technical_skills_json or "[]"),
        soft_skills=json.loads(profile.soft_skills_json or "[]"),
        certifications=json.loads(profile.certifications_json or "[]"),
        projects=json.loads(profile.projects_json or "[]"),
        experience=json.loads(profile.experience_json or "[]"),
        career_interests=json.loads(profile.career_interests_json or "[]"),
        preferred_roles=json.loads(profile.preferred_roles_json or "[]"),
        resume_filename=profile.resume_filename,
        resume_readiness_score=profile.resume_readiness_score or 0.0,
        resume_analysis=json.loads(profile.resume_analysis_json or "{}"),
        updated_at=profile.updated_at
    )

@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return format_profile_response(profile)

@router.put("", response_model=ProfileResponse)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
    
    if profile_in.university is not None: profile.university = profile_in.university
    if profile_in.degree is not None: profile.degree = profile_in.degree
    if profile_in.specialization is not None: profile.specialization = profile_in.specialization
    if profile_in.graduation_year is not None: profile.graduation_year = profile_in.graduation_year
    if profile_in.cgpa is not None: profile.cgpa = profile_in.cgpa
    
    if profile_in.technical_skills is not None:
        profile.technical_skills_json = json.dumps(profile_in.technical_skills)
    if profile_in.soft_skills is not None:
        profile.soft_skills_json = json.dumps(profile_in.soft_skills)
    if profile_in.certifications is not None:
        profile.certifications_json = json.dumps([c.model_dump() for c in profile_in.certifications])
    if profile_in.projects is not None:
        profile.projects_json = json.dumps([p.model_dump() for p in profile_in.projects])
    if profile_in.experience is not None:
        profile.experience_json = json.dumps([e.model_dump() for e in profile_in.experience])
    if profile_in.career_interests is not None:
        profile.career_interests_json = json.dumps(profile_in.career_interests)
    if profile_in.preferred_roles is not None:
        profile.preferred_roles_json = json.dumps(profile_in.preferred_roles)
        
    db.commit()
    db.refresh(profile)
    return format_profile_response(profile)
