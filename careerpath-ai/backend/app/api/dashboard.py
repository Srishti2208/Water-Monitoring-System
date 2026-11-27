import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, StudentProfile, LearningRoadmap, MockInterviewSession, JobPosting
from app.schemas.schemas import DashboardOverviewResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Student Progress Dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    
    # Calculate profile completion %
    completion = 20.0
    if profile:
        if profile.university and profile.degree: completion += 20.0
        tech_skills = json.loads(profile.technical_skills_json or "[]")
        if len(tech_skills) >= 3: completion += 25.0
        if profile.resume_readiness_score > 0: completion += 20.0
        projects = json.loads(profile.projects_json or "[]")
        if len(projects) >= 1: completion += 15.0

    resume_score = profile.resume_readiness_score if profile else 0.0

    # Active roadmap
    active_roadmap = db.query(LearningRoadmap).filter(
        LearningRoadmap.user_id == current_user.id
    ).order_by(LearningRoadmap.updated_at.desc()).first()

    roadmap_data = None
    if active_roadmap:
        roadmap_data = {
            "id": active_roadmap.id,
            "target_role": active_roadmap.target_role_title,
            "duration_days": active_roadmap.duration_days,
            "overall_progress": active_roadmap.overall_progress,
            "milestones_count": len(active_roadmap.milestones),
            "completed_milestones": sum(1 for m in active_roadmap.milestones if m.is_completed)
        }

    # Interviews
    interviews = db.query(MockInterviewSession).filter(
        MockInterviewSession.user_id == current_user.id
    ).all()
    avg_interview_score = round(sum(i.total_score for i in interviews) / len(interviews), 1) if interviews else 0.0

    tech_skills = json.loads(profile.technical_skills_json or "[]") if profile else []
    soft_skills = json.loads(profile.soft_skills_json or "[]") if profile else []

    # Recent activities
    recent_activities = [
        {"action": "Resume Analyzed", "detail": f"Resume score calculated at {resume_score}%", "time": "Recently"},
        {"action": "Profile Updated", "detail": f"{len(tech_skills)} technical skills validated", "time": "Active"},
        {"action": "Roadmap Synchronized", "detail": f"Targeting {active_roadmap.target_role_title if active_roadmap else 'Software Engineering'}", "time": "Ongoing"}
    ]

    return DashboardOverviewResponse(
        user_name=current_user.full_name,
        profile_completion=min(100.0, completion),
        resume_score=resume_score,
        top_recommended_role=active_roadmap.target_role_title if active_roadmap else "Full Stack Developer",
        skills_count=len(tech_skills) + len(soft_skills),
        active_roadmap=roadmap_data,
        interview_count=len(interviews),
        average_interview_score=avg_interview_score,
        recent_activities=recent_activities
    )
