from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: str = Field(..., description="Student or admin email address")
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = "student"  # "student" or "admin"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Student Profile Schemas ---
class ProjectItem(BaseModel):
    title: str
    description: str
    technologies: List[str] = []
    github_link: Optional[str] = ""

class ExperienceItem(BaseModel):
    title: str
    company: str
    duration: str
    description: str

class CertificationItem(BaseModel):
    name: str
    issuer: str
    year: Optional[str] = ""

class ProfileUpdate(BaseModel):
    university: Optional[str] = ""
    degree: Optional[str] = ""
    specialization: Optional[str] = ""
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = 0.0
    technical_skills: Optional[List[str]] = []
    soft_skills: Optional[List[str]] = []
    certifications: Optional[List[CertificationItem]] = []
    projects: Optional[List[ProjectItem]] = []
    experience: Optional[List[ExperienceItem]] = []
    career_interests: Optional[List[str]] = []
    preferred_roles: Optional[List[str]] = []

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    university: str
    degree: str
    specialization: str
    graduation_year: Optional[int]
    cgpa: float
    technical_skills: List[str] = []
    soft_skills: List[str] = []
    certifications: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    career_interests: List[str] = []
    preferred_roles: List[str] = []
    resume_filename: Optional[str] = None
    resume_readiness_score: float = 0.0
    resume_analysis: Optional[Dict[str, Any]] = {}
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Resume Analysis Schemas ---
class ResumeAnalysisResponse(BaseModel):
    readiness_score: float
    extracted_technical_skills: List[str]
    extracted_soft_skills: List[str]
    education_detected: Dict[str, Any]
    projects_detected: List[Dict[str, Any]]
    experience_detected: List[Dict[str, Any]]
    strengths: List[str]
    missing_sections: List[str]
    improvement_suggestions: List[Dict[str, str]]
    section_scores: Dict[str, float]


# --- Career Recommendation Schemas ---
class CareerRecommendationItem(BaseModel):
    slug: str
    title: str
    category: str
    suitability_score: float  # 0 to 100
    match_level: str          # "Excellent Match", "High Potential", "Requires Skill Growth"
    market_demand: str
    average_salary: str
    growth_rate: str
    matching_skills: List[str]
    missing_skills: List[str]
    reasoning: str
    top_learning_priorities: List[str]

class CareerRecommendationResponse(BaseModel):
    recommendations: List[CareerRecommendationItem]
    top_career_match: Optional[str]
    student_skills_analyzed: List[str]


# --- Job Recommendation Schemas ---
class JobRecommendationItem(BaseModel):
    id: int
    title: str
    company: str
    location: str
    employment_type: str
    experience_level: str
    salary_range: str
    description: str
    apply_url: str
    is_verified: bool
    required_skills: List[str]
    matching_skills: List[str]
    missing_skills: List[str]
    match_percentage: float


# --- Skill Gap Analysis Schemas ---
class SkillGapItem(BaseModel):
    skill: str
    category: str       # "Core Technical", "Framework/Tool", "Soft Skill"
    importance: str     # "High", "Medium", "Low"
    student_has: bool
    recommended_topics: List[str]
    learning_resources: List[Dict[str, str]]

class SkillGapReport(BaseModel):
    target_role: str
    readiness_percentage: float
    total_required_skills: int
    matched_skills_count: int
    missing_skills_count: int
    matched_skills: List[str]
    missing_skills: List[SkillGapItem]
    summary_analysis: str
    action_plan_summary: str


# --- Learning Roadmap Schemas ---
class TaskItem(BaseModel):
    id: str
    task: str
    completed: bool = False

class ResourceItem(BaseModel):
    title: str
    url: str
    type: str  # Video, Article, Documentation, Project

class MilestoneResponse(BaseModel):
    id: int
    week_number: int
    title: str
    description: str
    skills: List[str]
    tasks: List[TaskItem]
    resources: List[ResourceItem]
    is_completed: bool

class RoadmapResponse(BaseModel):
    id: int
    target_role_title: str
    career_role_slug: str
    duration_days: int
    overall_progress: float
    milestones: List[MilestoneResponse]

class TaskToggleRequest(BaseModel):
    milestone_id: int
    task_id: str
    completed: bool


# --- Mock Interview Schemas ---
class MockInterviewStartRequest(BaseModel):
    target_role: str
    difficulty: str = "Intermediate"  # "Beginner", "Intermediate", "Advanced"

class InterviewQuestionItem(BaseModel):
    id: int
    question: str
    category: str
    difficulty: str
    model_answer: Optional[str] = None
    key_points: List[str] = []
    student_answer: Optional[str] = ""
    score: Optional[float] = 0.0
    ai_feedback: Optional[str] = ""

class SubmitAnswerRequest(BaseModel):
    question_id: int
    student_answer: str

class AnswerEvaluationResponse(BaseModel):
    question_id: int
    score: float
    strengths: List[str]
    areas_for_improvement: List[str]
    ideal_response_tips: str
    full_feedback: str


# --- RAG Career Assistant Schemas ---
class RAGQueryRequest(BaseModel):
    question: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class RAGSourceChunk(BaseModel):
    document_title: str
    source_category: str
    snippet: str
    relevance_score: float

class RAGQueryResponse(BaseModel):
    answer: str
    sources: List[RAGSourceChunk]
    has_relevant_context: bool


# --- Admin & Dashboard Schemas ---
class DashboardOverviewResponse(BaseModel):
    user_name: str
    profile_completion: float
    resume_score: float
    top_recommended_role: str
    skills_count: int
    active_roadmap: Optional[Dict[str, Any]]
    interview_count: int
    average_interview_score: float
    recent_activities: List[Dict[str, Any]]

class AdminStatsResponse(BaseModel):
    total_students: int
    total_resumes_analyzed: int
    total_mock_interviews: int
    total_roadmaps_created: int
    total_rag_documents: int
    total_jobs: int
    popular_career_paths: List[Dict[str, Any]]
    recent_users: List[Dict[str, Any]]
