import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # "student" or "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roadmaps = relationship("LearningRoadmap", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("MockInterviewSession", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    university = Column(String(255), default="")
    degree = Column(String(255), default="")
    specialization = Column(String(255), default="")
    graduation_year = Column(Integer, nullable=True)
    cgpa = Column(Float, default=0.0)
    
    # Skills and experience stored as JSON text
    technical_skills_json = Column(Text, default="[]")  # e.g. ["Python", "SQL", "React"]
    soft_skills_json = Column(Text, default="[]")       # e.g. ["Communication", "Leadership"]
    certifications_json = Column(Text, default="[]")    # [{name, issuer, year}]
    projects_json = Column(Text, default="[]")          # [{title, description, technologies, github}]
    experience_json = Column(Text, default="[]")        # [{title, company, duration, description}]
    career_interests_json = Column(Text, default="[]")   # ["Data Scientist", "Full Stack Developer"]
    preferred_roles_json = Column(Text, default="[]")
    
    # Resume Analyzer details
    resume_filename = Column(String(255), nullable=True)
    resume_file_path = Column(String(500), nullable=True)
    resume_extracted_text = Column(Text, nullable=True)
    resume_readiness_score = Column(Float, default=0.0)
    resume_analysis_json = Column(Text, default="{}")   # Full breakdown: sections, weak areas, suggestions
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="profile")


class CareerRole(Base):
    __tablename__ = "career_roles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Software Engineering")
    description = Column(Text, nullable=False)
    average_salary = Column(String(100), default="$85,000 - $130,000")
    market_demand = Column(String(50), default="High")  # Very High, High, Medium
    growth_rate = Column(String(50), default="+22%")
    
    required_skills_json = Column(Text, default="[]")
    preferred_skills_json = Column(Text, default="[]")
    responsibilities_json = Column(Text, default="[]")
    career_levels_json = Column(Text, default="[]")      # Junior, Mid, Senior milestones


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), default="Remote / Hybrid")
    employment_type = Column(String(100), default="Full-time")  # Full-time, Internship, Contract
    experience_level = Column(String(100), default="Beginner")   # Beginner, Intermediate, Advanced
    salary_range = Column(String(100), default="$70,000 - $95,000")
    description = Column(Text, nullable=False)
    apply_url = Column(String(500), default="https://linkedin.com/jobs")
    is_verified = Column(Boolean, default=True)  # verified live vs sample
    required_skills_json = Column(Text, default="[]")
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    career_role_slug = Column(String(100), nullable=False)
    target_role_title = Column(String(255), nullable=False)
    duration_days = Column(Integer, default=60)  # 30, 60, or 90
    overall_progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="roadmaps")
    milestones = relationship("RoadmapMilestone", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapMilestone.week_number")


class RoadmapMilestone(Base):
    __tablename__ = "roadmap_milestones"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("learning_roadmaps.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    skills_json = Column(Text, default="[]")
    tasks_json = Column(Text, default="[]")         # [{id, task, completed: bool}]
    resources_json = Column(Text, default="[]")     # [{title, url, type}]
    is_completed = Column(Boolean, default=False)

    roadmap = relationship("LearningRoadmap", back_populates="milestones")


class MockInterviewSession(Base):
    __tablename__ = "mock_interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_role = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="Intermediate")  # Beginner, Intermediate, Advanced
    total_score = Column(Float, default=0.0)
    feedback_summary = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQA", back_populates="session", cascade="all, delete-orphan")


class InterviewQA(Base):
    __tablename__ = "interview_qas"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("mock_interview_sessions.id"), nullable=False)
    question = Column(Text, nullable=False)
    category = Column(String(50), default="Technical")  # Technical, HR, Coding, Aptitude
    difficulty = Column(String(50), default="Intermediate")
    model_answer = Column(Text, default="")
    key_points_json = Column(Text, default="[]")
    student_answer = Column(Text, default="")
    score = Column(Float, default=0.0)  # 0 to 100
    ai_feedback = Column(Text, default="")

    session = relationship("MockInterviewSession", back_populates="questions")


class RAGDocument(Base):
    __tablename__ = "rag_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Career Guide")
    source_filename = Column(String(255), default="")
    chunk_count = Column(Integer, default=0)
    uploaded_by_admin = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    chunks = relationship("RAGDocumentChunk", back_populates="document", cascade="all, delete-orphan")


class RAGDocumentChunk(Base):
    __tablename__ = "rag_document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("rag_documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")
    embedding_json = Column(Text, default="[]")  # Float vector stored as JSON array

    document = relationship("RAGDocument", back_populates="chunks")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    details_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="activities")
