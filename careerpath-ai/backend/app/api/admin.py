import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, StudentProfile, CareerRole, JobPosting, RAGDocument, MockInterviewSession, LearningRoadmap
from app.schemas.schemas import AdminStatsResponse
from app.api.deps import get_current_admin
from app.services.rag_service import rag_service
from app.services.resume_service import resume_service

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_students = db.query(User).filter(User.role == "student").count()
    total_resumes = db.query(StudentProfile).filter(StudentProfile.resume_readiness_score > 0).count()
    total_interviews = db.query(MockInterviewSession).count()
    total_roadmaps = db.query(LearningRoadmap).count()
    total_rag_docs = db.query(RAGDocument).count()
    total_jobs = db.query(JobPosting).count()

    popular_roles = [
        {"role": "Software Engineer", "students_interested": 48},
        {"role": "AI/ML Engineer", "students_interested": 42},
        {"role": "Full Stack Developer", "students_interested": 37},
        {"role": "Data Analyst", "students_interested": 29},
        {"role": "Cloud Engineer", "students_interested": 21}
    ]

    recent_users = []
    users = db.query(User).order_by(User.created_at.desc()).limit(8).all()
    for u in users:
        p = u.profile
        recent_users.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "cgpa": p.cgpa if p else 0.0,
            "resume_score": p.resume_readiness_score if p else 0.0,
            "created_at": u.created_at
        })

    return AdminStatsResponse(
        total_students=total_students,
        total_resumes_analyzed=total_resumes,
        total_mock_interviews=total_interviews,
        total_roadmaps_created=total_roadmaps,
        total_rag_documents=total_rag_docs,
        total_jobs=total_jobs,
        popular_career_paths=popular_roles,
        recent_users=recent_users
    )

@router.get("/users")
def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    results = []
    for u in users:
        p = u.profile
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "university": p.university if p else "",
            "cgpa": p.cgpa if p else 0.0,
            "resume_score": p.resume_readiness_score if p else 0.0,
            "created_at": u.created_at
        })
    return results

@router.post("/career-roles")
def create_career_role(
    payload: Dict[str, Any],
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    role = CareerRole(
        slug=payload["slug"],
        title=payload["title"],
        category=payload.get("category", "Software Engineering"),
        description=payload["description"],
        average_salary=payload.get("average_salary", "$80,000 - $120,000"),
        market_demand=payload.get("market_demand", "High"),
        growth_rate=payload.get("growth_rate", "+20%"),
        required_skills_json=json.dumps(payload.get("required_skills", [])),
        preferred_skills_json=json.dumps(payload.get("preferred_skills", []))
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return {"message": "Role created successfully", "id": role.id}

@router.post("/jobs")
def create_job_posting(
    payload: Dict[str, Any],
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    job = JobPosting(
        title=payload["title"],
        company=payload["company"],
        location=payload.get("location", "Remote / Hybrid"),
        employment_type=payload.get("employment_type", "Full-time"),
        experience_level=payload.get("experience_level", "Beginner"),
        salary_range=payload.get("salary_range", "$75,000 - $95,000"),
        description=payload["description"],
        apply_url=payload.get("apply_url", "https://linkedin.com/jobs"),
        is_verified=payload.get("is_verified", True),
        required_skills_json=json.dumps(payload.get("required_skills", []))
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"message": "Job posting added successfully", "id": job.id}

@router.post("/upload-guide")
async def upload_guide_to_rag(
    title: str = Form(...),
    category: str = Form("Career Guide"),
    file: UploadFile = File(None),
    content_text: str = Form(""),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    text = content_text
    filename = ""
    if file:
        filename = file.filename
        bytes_data = await file.read()
        if filename.lower().endswith(".pdf"):
            text = resume_service.extract_text_from_pdf(bytes_data)
        else:
            text = bytes_data.decode("utf-8", errors="ignore")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    doc = rag_service.ingest_document(db, title, category, text, source_filename=filename)
    return {
        "message": "Document successfully ingested into RAG vector index",
        "doc_id": doc.id,
        "title": doc.title,
        "chunks_indexed": doc.chunk_count
    }
