import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import CareerRole, StudentProfile, JobPosting
from app.schemas.schemas import (
    CareerRecommendationItem,
    CareerRecommendationResponse,
    SkillGapItem,
    SkillGapReport,
    JobRecommendationItem
)

# Skill learning resources catalog
SKILL_LEARNING_RESOURCES = {
    "Python": [
        {"title": "Python for Everybody (University of Michigan)", "url": "https://www.coursera.org/specializations/python", "type": "Course"},
        {"title": "Official Python Documentation & Tutorial", "url": "https://docs.python.org/3/tutorial/", "type": "Documentation"}
    ],
    "SQL": [
        {"title": "SQL for Data Science", "url": "https://mode.com/sql-tutorial/", "type": "Interactive Guide"},
        {"title": "HackerRank SQL Practice", "url": "https://www.hackerrank.com/domains/sql", "type": "Practice"}
    ],
    "React": [
        {"title": "Official React Documentation (react.dev)", "url": "https://react.dev", "type": "Documentation"},
        {"title": "Full Stack Open (University of Helsinki)", "url": "https://fullstackopen.com/", "type": "Course"}
    ],
    "Next.js": [
        {"title": "Learn Next.js App Router (Official Vercel)", "url": "https://nextjs.org/learn", "type": "Tutorial"}
    ],
    "Docker": [
        {"title": "Docker for Beginners (Docker Docs)", "url": "https://docs.docker.com/get-started/", "type": "Documentation"},
        {"title": "FreeCodeCamp Docker Course", "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo", "type": "Video"}
    ],
    "Machine Learning": [
        {"title": "Andrew Ng Machine Learning Specialization", "url": "https://www.deeplearning.ai/courses/machine-learning-specialization/", "type": "Course"},
        {"title": "Scikit-Learn User Guide & Examples", "url": "https://scikit-learn.org/stable/user_guide.html", "type": "Documentation"}
    ],
    "AWS": [
        {"title": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/", "type": "Course"}
    ],
    "Kubernetes": [
        {"title": "Kubernetes Basics & Tutorials", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "type": "Documentation"}
    ],
    "FastAPI": [
        {"title": "FastAPI Tutorial - User Guide", "url": "https://fastapi.tiangolo.com/tutorial/", "type": "Documentation"}
    ]
}

class RecommendationService:
    def recommend_careers(self, profile: StudentProfile, db: Session) -> CareerRecommendationResponse:
        """Analyze student profile against all career roles and compute suitability score."""
        roles = db.query(CareerRole).all()
        student_tech_skills = set(json.loads(profile.technical_skills_json or "[]"))
        student_soft_skills = set(json.loads(profile.soft_skills_json or "[]"))
        all_student_skills = student_tech_skills.union(student_soft_skills)

        recommendations: List[CareerRecommendationItem] = []

        for role in roles:
            required_skills = set(json.loads(role.required_skills_json or "[]"))
            preferred_skills = set(json.loads(role.preferred_skills_json or "[]"))

            matching_req = required_skills.intersection(all_student_skills)
            missing_req = required_skills.difference(all_student_skills)
            matching_pref = preferred_skills.intersection(all_student_skills)
            missing_pref = preferred_skills.difference(all_student_skills)

            # Calculation:
            # - Required skills: 65% weight
            # - Preferred skills: 20% weight
            # - CGPA / Academic Factor: 10% weight
            # - Career interest alignment: 5% weight
            req_score = (len(matching_req) / len(required_skills)) * 65.0 if required_skills else 50.0
            pref_score = (len(matching_pref) / len(preferred_skills)) * 20.0 if preferred_skills else 10.0
            
            cgpa_factor = min(10.0, (profile.cgpa / 10.0) * 10.0) if profile.cgpa else 7.0
            
            # Check career interest boost
            interests = json.loads(profile.career_interests_json or "[]")
            interest_boost = 5.0 if (role.title in interests or role.slug in interests or role.category in interests) else 0.0

            suitability = round(min(100.0, req_score + pref_score + cgpa_factor + interest_boost), 1)

            # Match Level Label
            if suitability >= 75:
                match_level = "Excellent Match"
            elif suitability >= 50:
                match_level = "High Potential"
            else:
                match_level = "Requires Skill Growth"

            # Explainable reasoning
            if len(matching_req) > 0:
                reasoning = (
                    f"Strong alignment with {len(matching_req)} of {len(required_skills)} core role requirements "
                    f"({', '.join(list(matching_req)[:3])}). "
                    f"Adding {', '.join(list(missing_req)[:2]) if missing_req else 'advanced projects'} will maximize interview readiness."
                )
            else:
                reasoning = (
                    f"Foundational role in {role.category}. Developing priority skills like "
                    f"{', '.join(list(missing_req)[:3])} will unlock this career path."
                )

            recommendations.append(CareerRecommendationItem(
                slug=role.slug,
                title=role.title,
                category=role.category,
                suitability_score=suitability,
                match_level=match_level,
                market_demand=role.market_demand,
                average_salary=role.average_salary,
                growth_rate=role.growth_rate,
                matching_skills=sorted(list(matching_req.union(matching_pref))),
                missing_skills=sorted(list(missing_req.union(missing_pref))),
                reasoning=reasoning,
                top_learning_priorities=sorted(list(missing_req))[:4]
            ))

        # Sort recommendations descending by suitability score
        recommendations.sort(key=lambda x: x.suitability_score, reverse=True)
        top_career = recommendations[0].title if recommendations else None

        return CareerRecommendationResponse(
            recommendations=recommendations,
            top_career_match=top_career,
            student_skills_analyzed=sorted(list(all_student_skills))
        )

    def analyze_skill_gap(self, role_slug: str, profile: StudentProfile, db: Session) -> SkillGapReport:
        """Compare student's skills against a target career role to produce gap report."""
        role = db.query(CareerRole).filter(CareerRole.slug == role_slug).first()
        if not role:
            # Fallback by title search
            role = db.query(CareerRole).filter(CareerRole.title.ilike(f"%{role_slug}%")).first()
        if not role:
            raise ValueError(f"Career role '{role_slug}' not found.")

        student_tech = set(json.loads(profile.technical_skills_json or "[]"))
        student_soft = set(json.loads(profile.soft_skills_json or "[]"))
        student_skills = student_tech.union(student_soft)

        required = json.loads(role.required_skills_json or "[]")
        preferred = json.loads(role.preferred_skills_json or "[]")

        all_target_skills = required + [p for p in preferred if p not in required]
        
        matched_skills = [s for s in all_target_skills if s in student_skills]
        missing_skill_names = [s for s in all_target_skills if s not in student_skills]

        missing_items: List[SkillGapItem] = []
        for s in missing_skill_names:
            is_core = s in required
            importance = "High" if is_core else "Medium"
            category = "Core Technical" if s in TECHNICAL_SKILLS_TAXONOMY else ("Soft Skill" if s in SOFT_SKILLS_TAXONOMY else "Framework/Tool")
            
            # Default curated resources
            resources = SKILL_LEARNING_RESOURCES.get(s, [
                {"title": f"Complete {s} Roadmap & Documentation", "url": f"https://devdocs.io/", "type": "Documentation"},
                {"title": f"{s} Crash Course for Developers", "url": "https://www.youtube.com/", "type": "Video"}
            ])

            missing_items.append(SkillGapItem(
                skill=s,
                category=category,
                importance=importance,
                student_has=False,
                recommended_topics=[f"{s} Fundamentals", f"{s} Best Practices", f"Hands-on {s} Project Integration"],
                learning_resources=resources
            ))

        readiness = round((len(matched_skills) / len(all_target_skills) * 100.0), 1) if all_target_skills else 100.0

        summary = (
            f"You possess {len(matched_skills)} of {len(all_target_skills)} essential skills for {role.title} "
            f"({readiness}% readiness). Closing the gap on {len(missing_items)} priority skills will elevate your profile to employer placement standards."
        )

        action_plan = (
            f"Focus on the {len([m for m in missing_items if m.importance == 'High'])} high-priority core skills first. "
            f"Allocate 10-15 hours/week following the personalized learning roadmap and integrate each new skill into a portfolio project."
        )

        return SkillGapReport(
            target_role=role.title,
            readiness_percentage=readiness,
            total_required_skills=len(all_target_skills),
            matched_skills_count=len(matched_skills),
            missing_skills_count=len(missing_items),
            matched_skills=matched_skills,
            missing_skills=missing_items,
            summary_analysis=summary,
            action_plan_summary=action_plan
        )

    def recommend_jobs(self, profile: StudentProfile, db: Session, level: Optional[str] = None) -> List[JobRecommendationItem]:
        """Match student's skills against job postings and rank by compatibility."""
        query = db.query(JobPosting)
        if level:
            query = query.filter(JobPosting.experience_level.ilike(level))
        jobs = query.all()

        student_skills = set(json.loads(profile.technical_skills_json or "[]")).union(
            set(json.loads(profile.soft_skills_json or "[]"))
        )

        results: List[JobRecommendationItem] = []

        for job in jobs:
            required = set(json.loads(job.required_skills_json or "[]"))
            matched = required.intersection(student_skills)
            missing = required.difference(student_skills)

            match_pct = round((len(matched) / len(required) * 100.0), 1) if required else 60.0

            results.append(JobRecommendationItem(
                id=job.id,
                title=job.title,
                company=job.company,
                location=job.location,
                employment_type=job.employment_type,
                experience_level=job.experience_level,
                salary_range=job.salary_range,
                description=job.description,
                apply_url=job.apply_url,
                is_verified=job.is_verified,
                required_skills=sorted(list(required)),
                matching_skills=sorted(list(matched)),
                missing_skills=sorted(list(missing)),
                match_percentage=match_pct
            ))

        # Sort jobs descending by match percentage
        results.sort(key=lambda x: x.match_percentage, reverse=True)
        return results

recommendation_service = RecommendationService()
