import json
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, StudentProfile
from app.services.resume_service import resume_service
from app.schemas.schemas import ResumeAnalysisResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/resume", tags=["Resume Analyzer"])

@router.post("/upload", response_model=ResumeAnalysisResponse)
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resume files are accepted.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Resume file exceeds 10MB limit.")

    # Save to local storage
    filename = f"user_{current_user.id}_{Path(file.filename).name}"
    file_path = settings.UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract & Analyze
    try:
        extracted_text = resume_service.extract_text_from_pdf(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")

    analysis = resume_service.analyze_resume(extracted_text)

    # Persist to StudentProfile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    profile.resume_filename = file.filename
    profile.resume_file_path = str(file_path)
    profile.resume_extracted_text = extracted_text
    profile.resume_readiness_score = analysis["readiness_score"]
    profile.resume_analysis_json = json.dumps(analysis)

    # Auto-merge newly detected skills into profile if currently empty or sparse
    current_tech = set(json.loads(profile.technical_skills_json or "[]"))
    new_tech = current_tech.union(set(analysis["extracted_technical_skills"]))
    profile.technical_skills_json = json.dumps(sorted(list(new_tech)))

    current_soft = set(json.loads(profile.soft_skills_json or "[]"))
    new_soft = current_soft.union(set(analysis["extracted_soft_skills"]))
    profile.soft_skills_json = json.dumps(sorted(list(new_soft)))

    if analysis["education_detected"].get("cgpa") and (not profile.cgpa or profile.cgpa == 0.0):
        profile.cgpa = analysis["education_detected"]["cgpa"]

    db.commit()

    return ResumeAnalysisResponse(
        readiness_score=analysis["readiness_score"],
        extracted_technical_skills=analysis["extracted_technical_skills"],
        extracted_soft_skills=analysis["extracted_soft_skills"],
        education_detected=analysis["education_detected"],
        projects_detected=analysis["projects_detected"],
        experience_detected=analysis["experience_detected"],
        strengths=analysis["strengths"],
        missing_sections=analysis["missing_sections"],
        improvement_suggestions=analysis["improvement_suggestions"],
        section_scores=analysis["section_scores"],
    )

@router.get("/latest", response_model=ResumeAnalysisResponse)
def get_latest_resume_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile or not profile.resume_analysis_json or profile.resume_analysis_json == "{}":
        raise HTTPException(status_code=404, detail="No resume has been uploaded or analyzed yet.")

    data = json.loads(profile.resume_analysis_json)
    return ResumeAnalysisResponse(**data)
