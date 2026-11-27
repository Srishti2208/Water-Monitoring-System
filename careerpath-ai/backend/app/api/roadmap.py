import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, LearningRoadmap, RoadmapMilestone
from app.services.roadmap_service import roadmap_service
from app.schemas.schemas import RoadmapResponse, MilestoneResponse, TaskToggleRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/roadmap", tags=["Personalized Learning Roadmap"])

def format_roadmap_response(roadmap: LearningRoadmap) -> RoadmapResponse:
    milestone_objs = []
    for m in roadmap.milestones:
        tasks = json.loads(m.tasks_json or "[]")
        resources = json.loads(m.resources_json or "[]")
        skills = json.loads(m.skills_json or "[]")
        milestone_objs.append(MilestoneResponse(
            id=m.id,
            week_number=m.week_number,
            title=m.title,
            description=m.description or "",
            skills=skills,
            tasks=tasks,
            resources=resources,
            is_completed=m.is_completed
        ))

    return RoadmapResponse(
        id=roadmap.id,
        target_role_title=roadmap.target_role_title,
        career_role_slug=roadmap.career_role_slug,
        duration_days=roadmap.duration_days,
        overall_progress=roadmap.overall_progress or 0.0,
        milestones=milestone_objs
    )

@router.post("/generate", response_model=RoadmapResponse)
def generate_roadmap(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    career_slug = payload.get("career_slug", "software-engineer")
    duration_days = int(payload.get("duration_days", 60))
    roadmap = roadmap_service.generate_roadmap(current_user.id, career_slug, duration_days, db)
    return format_roadmap_response(roadmap)

@router.get("/active", response_model=Optional[RoadmapResponse])
def get_active_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(LearningRoadmap).filter(
        LearningRoadmap.user_id == current_user.id
    ).order_by(LearningRoadmap.updated_at.desc()).first()

    if not roadmap:
        # Default auto-generate Software Engineer roadmap
        roadmap = roadmap_service.generate_roadmap(current_user.id, "software-engineer", 60, db)
    
    return format_roadmap_response(roadmap)

@router.post("/task/toggle", response_model=RoadmapResponse)
def toggle_task_status(
    toggle_in: TaskToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(RoadmapMilestone).filter(RoadmapMilestone.id == toggle_in.milestone_id).first()
    if not milestone or milestone.roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Milestone not found or unauthorized.")
    
    roadmap = roadmap_service.toggle_task(
        milestone.roadmap_id,
        toggle_in.milestone_id,
        toggle_in.task_id,
        toggle_in.completed,
        db
    )
    return format_roadmap_response(roadmap)
