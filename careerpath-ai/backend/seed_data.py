import json
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User,
    StudentProfile,
    CareerRole,
    JobPosting,
    LearningRoadmap,
    RoadmapMilestone
)
from app.services.rag_service import rag_service

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Users (Admin & Student)
    admin_user = db.query(User).filter(User.email == "admin@careerpath.ai").first()
    if not admin_user:
        admin_user = User(
            email="admin@careerpath.ai",
            hashed_password=get_password_hash("admin123"),
            full_name="Placement Administrator",
            role="admin",
            is_active=True
        )
        db.add(admin_user)

    student_user = db.query(User).filter(User.email == "student@careerpath.ai").first()
    if not student_user:
        student_user = User(
            email="student@careerpath.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Alex Chen",
            role="student",
            is_active=True
        )
        db.add(student_user)
        db.flush()

        # Seed realistic Student Profile
        profile = StudentProfile(
            user_id=student_user.id,
            university="National Institute of Technology",
            degree="Bachelor of Technology",
            specialization="Computer Science and Engineering",
            graduation_year=2026,
            cgpa=8.8,
            technical_skills_json=json.dumps([
                "Python", "JavaScript", "TypeScript", "React", "Next.js", "SQL", "Git", "Docker", "Machine Learning"
            ]),
            soft_skills_json=json.dumps([
                "Problem Solving", "Teamwork", "Analytical Thinking", "Communication"
            ]),
            certifications_json=json.dumps([
                {"name": "AWS Certified Cloud Practitioner", "issuer": "Amazon Web Services", "year": "2025"},
                {"name": "Meta Front-End Developer Professional Certificate", "issuer": "Coursera", "year": "2024"}
            ]),
            projects_json=json.dumps([
                {
                    "title": "Smart Campus Waste Sorting AI",
                    "description": "Engineered real-time computer vision classifier with 94% precision deployed on edge device.",
                    "technologies": ["Python", "PyTorch", "FastAPI", "OpenCV"],
                    "github_link": "https://github.com/alexchen/campus-ai"
                },
                {
                    "title": "Distributed Task Scheduler Microservice",
                    "description": "High-throughput asynchronous queuing worker processing 5,000 tasks/second with Redis and Docker.",
                    "technologies": ["TypeScript", "Node.js", "Redis", "Docker"],
                    "github_link": "https://github.com/alexchen/task-scheduler"
                }
            ]),
            experience_json=json.dumps([
                {
                    "title": "Software Engineering Intern",
                    "company": "TechInnovate Labs",
                    "duration": "May 2025 - August 2025",
                    "description": "Developed React dashboard components and optimized backend PostgreSQL queries reducing load latency by 42%."
                }
            ]),
            career_interests_json=json.dumps([
                "Software Engineer", "Full Stack Developer", "AI/ML Engineer"
            ]),
            preferred_roles_json=json.dumps(["Full Stack Developer", "Software Engineer"]),
            resume_filename="Alex_Chen_SWE_Resume.pdf",
            resume_readiness_score=88.5,
            resume_analysis_json=json.dumps({
                "readiness_score": 88.5,
                "extracted_technical_skills": ["Python", "JavaScript", "TypeScript", "React", "Next.js", "SQL", "Git", "Docker", "Machine Learning"],
                "extracted_soft_skills": ["Problem Solving", "Teamwork", "Communication"],
                "education_detected": {"cgpa": 8.8, "has_degree_mention": True},
                "strengths": [
                    "High technical competence across full-stack and machine learning",
                    "Demonstrated production impact metrics (42% latency reduction, 5k tasks/sec)",
                    "Active GitHub open-source repositories and verified internships"
                ],
                "missing_sections": ["Honors & Awards"],
                "improvement_suggestions": [
                    {"category": "Impact", "message": "Add automated system architecture diagrams or live demo URLs to your projects."},
                    {"category": "Cloud Depth", "message": "Demonstrate Kubernetes or Terraform orchestration for cloud scalability."}
                ],
                "section_scores": {
                    "Contact & Heading": 10.0,
                    "Education & Academics": 15.0,
                    "Technical Skills": 24.0,
                    "Projects & Experience": 26.5,
                    "Impact & Action Verbs": 13.0
                }
            })
        )
        db.add(profile)

    db.commit()

    # 2. Seed 9 Complete Career Roles
    roles_data = [
        {
            "slug": "software-engineer",
            "title": "Software Engineer",
            "category": "Core Engineering",
            "description": "Designs, implements, and tests robust software systems, algorithms, and modular microservices.",
            "average_salary": "$95,000 - $145,000",
            "market_demand": "Very High",
            "growth_rate": "+25%",
            "required_skills": ["Python", "Java", "C++", "SQL", "Git", "Data Structures", "Algorithms"],
            "preferred_skills": ["Docker", "Linux", "CI/CD", "System Design", "Unit Testing"],
            "responsibilities": ["Develop scalable backend microservices", "Optimize database query execution", "Collaborate via Agile pull requests"]
        },
        {
            "slug": "full-stack-developer",
            "title": "Full Stack Developer",
            "category": "Web & Cloud",
            "description": "Builds end-to-end web applications combining responsive React/Next.js frontends with high-performance APIs and databases.",
            "average_salary": "$90,000 - $140,000",
            "market_demand": "Very High",
            "growth_rate": "+27%",
            "required_skills": ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "SQL", "HTML", "CSS"],
            "preferred_skills": ["Tailwind CSS", "PostgreSQL", "Docker", "REST APIs", "GraphQL"],
            "responsibilities": ["Build interactive UI components", "Implement server-rendered endpoints", "Integrate third-party APIs and payment gateways"]
        },
        {
            "slug": "ai-ml-engineer",
            "title": "AI/ML Engineer",
            "category": "Artificial Intelligence",
            "description": "Architects, trains, and deploys predictive machine learning, deep learning, and generative AI models into production.",
            "average_salary": "$115,000 - $175,000",
            "market_demand": "Exponential",
            "growth_rate": "+38%",
            "required_skills": ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn"],
            "preferred_skills": ["LangChain", "RAG", "LLM", "Docker", "MLOps", "Computer Vision", "NLP"],
            "responsibilities": ["Train neural network architectures", "Build RAG vector retrieval pipelines", "Serve low-latency model inference endpoints"]
        },
        {
            "slug": "data-scientist",
            "title": "Data Scientist",
            "category": "Data & Analytics",
            "description": "Extracts actionable predictive insights from complex datasets using advanced statistical modeling and machine learning.",
            "average_salary": "$105,000 - $155,000",
            "market_demand": "High",
            "growth_rate": "+28%",
            "required_skills": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Statistics", "Machine Learning"],
            "preferred_skills": ["R", "Tableau", "PowerBI", "A/B Testing", "BigQuery"],
            "responsibilities": ["Formulate data-driven hypotheses", "Execute statistical hypothesis testing", "Build predictive retention and churn models"]
        },
        {
            "slug": "data-analyst",
            "title": "Data Analyst",
            "category": "Data & Analytics",
            "description": "Transforms raw enterprise data into interactive executive dashboards, KPIs, and actionable operational insights.",
            "average_salary": "$70,000 - $105,000",
            "market_demand": "High",
            "growth_rate": "+23%",
            "required_skills": ["SQL", "Excel", "Python", "Tableau", "PowerBI", "Data Visualization"],
            "preferred_skills": ["Pandas", "Statistics", "Data Cleaning", "Google Analytics"],
            "responsibilities": ["Develop executive KPI dashboards", "Conduct ad-hoc SQL exploratory queries", "Present weekly business intelligence reports"]
        },
        {
            "slug": "cloud-engineer",
            "title": "Cloud Engineer",
            "category": "Cloud & DevOps",
            "description": "Architects, provisions, and automates resilient multi-region cloud infrastructures across AWS, Azure, and GCP.",
            "average_salary": "$100,000 - $150,000",
            "market_demand": "Very High",
            "growth_rate": "+30%",
            "required_skills": ["AWS", "Linux", "Docker", "Kubernetes", "Git", "Terraform"],
            "preferred_skills": ["CI/CD", "Python", "Networking", "Azure", "GCP", "Bash"],
            "responsibilities": ["Manage infrastructure as code via Terraform", "Maintain Kubernetes clusters", "Ensure 99.99% service availability"]
        },
        {
            "slug": "cybersecurity-analyst",
            "title": "Cybersecurity Analyst",
            "category": "Security & Defense",
            "description": "Monitors, detects, and defends organizational networks and applications against unauthorized access and cyber threats.",
            "average_salary": "$88,000 - $135,000",
            "market_demand": "Critical",
            "growth_rate": "+32%",
            "required_skills": ["Network Security", "Linux", "Cryptography", "Firewalls", "Wireshark", "OWASP"],
            "preferred_skills": ["Penetration Testing", "SIEM", "Python", "Ethical Hacking"],
            "responsibilities": ["Perform vulnerability assessments", "Analyze incident response logs", "Harden perimeter firewall rules"]
        },
        {
            "slug": "qa-engineer",
            "title": "QA Automation Engineer",
            "category": "Quality & Testing",
            "description": "Develops automated end-to-end and regression test suites ensuring software reliability, performance, and defect-free releases.",
            "average_salary": "$75,000 - $115,000",
            "market_demand": "Steady",
            "growth_rate": "+18%",
            "required_skills": ["Selenium", "Python", "JavaScript", "Jest", "Git", "Postman"],
            "preferred_skills": ["Cypress", "Playwright", "CI/CD", "Load Testing", "PyTest"],
            "responsibilities": ["Write automated regression test suites", "Execute performance load testing", "Collaborate on bug triage and verification"]
        },
        {
            "slug": "python-developer",
            "title": "Python Developer",
            "category": "Core Engineering",
            "description": "Specializes in building scalable backend services, automated scripts, data scrapers, and data integration pipelines using Python.",
            "average_salary": "$85,000 - $130,000",
            "market_demand": "High",
            "growth_rate": "+24%",
            "required_skills": ["Python", "FastAPI", "Django", "SQL", "Git", "REST APIs"],
            "preferred_skills": ["Docker", "PostgreSQL", "Redis", "Celery", "PyTest"],
            "responsibilities": ["Implement asynchronous RESTful web APIs", "Design background processing pipelines", "Write comprehensive unit test suites"]
        }
    ]

    for r in roles_data:
        existing = db.query(CareerRole).filter(CareerRole.slug == r["slug"]).first()
        if not existing:
            role_obj = CareerRole(
                slug=r["slug"],
                title=r["title"],
                category=r["category"],
                description=r["description"],
                average_salary=r["average_salary"],
                market_demand=r["market_demand"],
                growth_rate=r["growth_rate"],
                required_skills_json=json.dumps(r["required_skills"]),
                preferred_skills_json=json.dumps(r["preferred_skills"]),
                responsibilities_json=json.dumps(r["responsibilities"])
            )
            db.add(role_obj)

    db.commit()

    # 3. Seed Realistic Job Opportunities
    jobs_data = [
        {
            "title": "Associate Software Engineer",
            "company": "Microsoft",
            "location": "Redmond, WA / Hybrid",
            "employment_type": "Full-time",
            "experience_level": "Beginner",
            "salary_range": "$110,000 - $135,000",
            "description": "Join our cloud developer experience team to build world-class SDKs and distributed cloud services. Ideal for fresh graduates with strong coding fundamentals.",
            "apply_url": "https://careers.microsoft.com",
            "is_verified": True,
            "required_skills": ["Python", "C++", "Data Structures", "Algorithms", "Git"]
        },
        {
            "title": "Junior Full Stack Developer",
            "company": "Stripe",
            "location": "San Francisco, CA / Remote",
            "employment_type": "Full-time",
            "experience_level": "Beginner",
            "salary_range": "$115,000 - $140,000",
            "description": "Build high-impact merchant checkout experiences and developer dashboards using React, TypeScript, and microservice backends.",
            "apply_url": "https://stripe.com/jobs",
            "is_verified": True,
            "required_skills": ["React", "TypeScript", "JavaScript", "SQL", "Git"]
        },
        {
            "title": "AI/ML Engineer Intern",
            "company": "Google DeepMind",
            "location": "Mountain View, CA",
            "employment_type": "Internship",
            "experience_level": "Beginner",
            "salary_range": "$52/hr ($108,000 annualized)",
            "description": "Work with world-class research scientists to benchmark, fine-tune, and evaluate novel multimodal reasoning architectures.",
            "apply_url": "https://careers.google.com",
            "is_verified": True,
            "required_skills": ["Python", "PyTorch", "Machine Learning", "NumPy", "Deep Learning"]
        },
        {
            "title": "Frontend Engineer (Next.js / React)",
            "company": "Vercel",
            "location": "Remote",
            "employment_type": "Full-time",
            "experience_level": "Intermediate",
            "salary_range": "$125,000 - $160,000",
            "description": "Help us build the next evolution of web deployment workflows and developer analytics with React Server Components.",
            "apply_url": "https://vercel.com/careers",
            "is_verified": True,
            "required_skills": ["Next.js", "React", "TypeScript", "Tailwind CSS", "Git"]
        },
        {
            "title": "Cloud Infrastructure Associate",
            "company": "Amazon Web Services (AWS)",
            "location": "Seattle, WA / Hybrid",
            "employment_type": "Full-time",
            "experience_level": "Beginner",
            "salary_range": "$105,000 - $130,000",
            "description": "Help automate cloud telemetry pipelines, manage Linux server fleets, and support automated cloud deployments.",
            "apply_url": "https://amazon.jobs",
            "is_verified": True,
            "required_skills": ["AWS", "Linux", "Python", "Docker", "Git"]
        },
        {
            "title": "Data Analyst Graduate Trainee",
            "company": "Deloitte",
            "location": "New York, NY / Hybrid",
            "employment_type": "Full-time",
            "experience_level": "Beginner",
            "salary_range": "$78,000 - $92,000",
            "description": "Analyze client enterprise data, extract operational metrics, and build executive reporting dashboards in Tableau and SQL.",
            "apply_url": "https://deloitte.com/careers",
            "is_verified": True,
            "required_skills": ["SQL", "Excel", "Tableau", "Data Visualization", "Communication"]
        },
        {
            "title": "Cybersecurity Associate",
            "company": "CrowdStrike",
            "location": "Austin, TX / Remote",
            "employment_type": "Full-time",
            "experience_level": "Beginner",
            "salary_range": "$92,000 - $118,000",
            "description": "Monitor real-time threat telemetry feeds, investigate endpoint security alerts, and automate malware incident response scripts.",
            "apply_url": "https://crowdstrike.com/careers",
            "is_verified": True,
            "required_skills": ["Network Security", "Linux", "Python", "Wireshark", "Firewalls"]
        },
        {
            "title": "Software Development Engineer in Test (SDET)",
            "company": "Adobe",
            "location": "San Jose, CA / Hybrid",
            "employment_type": "Full-time",
            "experience_level": "Beginner",
            "salary_range": "$95,000 - $120,000",
            "description": "Design automated testing frameworks for Creative Cloud web applications using Playwright and Jest.",
            "apply_url": "https://adobe.com/careers",
            "is_verified": True,
            "required_skills": ["Selenium", "JavaScript", "Python", "Jest", "Git"]
        }
    ]

    for j in jobs_data:
        existing = db.query(JobPosting).filter(JobPosting.title == j["title"], JobPosting.company == j["company"]).first()
        if not existing:
            job_obj = JobPosting(
                title=j["title"],
                company=j["company"],
                location=j["location"],
                employment_type=j["employment_type"],
                experience_level=j["experience_level"],
                salary_range=j["salary_range"],
                description=j["description"],
                apply_url=j["apply_url"],
                is_verified=j["is_verified"],
                required_skills_json=json.dumps(j["required_skills"])
            )
            db.add(job_obj)

    db.commit()

    # 4. Ingest 4 Rich Knowledge Base Documents for RAG
    rag_documents = [
        {
            "title": "Campus Placement Success Guide 2026",
            "category": "Career Guide",
            "content": """
Campus Placement Success Guide 2026: Strategy, Evaluation Criteria & Milestones.
University campus placements follow a 4-tier selection process:
1. Online Coding & Aptitude Assessment: Typically 2 coding questions (Data Structures & Algorithms: Arrays, Two-Pointer, Hash Tables, Dynamic Programming) and 20 aptitude questions (probability, permutations, logical reasoning). Passing cutoff is typically 80%+.
2. Technical Interview Round 1: Core Fundamentals & Problem Solving. Interviewers test your ability to articulate thought process out loud, discuss time and space complexity, and write clean, syntax-error-free code.
3. Technical Interview Round 2: Projects, System Architecture & Deep Dive. Candidates must be able to justify architectural choices: why SQL over NoSQL, how indexing works, how race conditions are handled, and how APIs were secured with JWT.
4. HR & Cultural Fit Round: Behavioral questions assessed via STAR methodology (Situation, Task, Action, Result). Demonstrating teamwork, humility, adaptability, and high problem-solving motivation is essential.
Key rule: Always quantify achievements on resumes (e.g., 'Optimized query latency by 35%', 'Handled 5,000 requests/second').
"""
        },
        {
            "title": "Full-Stack & Backend Engineering Placement Rubric",
            "category": "Industry Report",
            "content": """
Full-Stack & Backend Engineering Placement Standards for University Candidates.
Employers evaluate entry-level full-stack engineers across five primary pillars:
1. Programming Language Mastery: Deep fluency in TypeScript/JavaScript or Python/Java. Understanding asynchronous execution, event loop non-blocking I/O, closures, and strict typing.
2. Modern Frontend Architecture: React 18/19 or Next.js App Router. State management, Server vs Client components, responsive styling with Tailwind CSS, and Web Vitals (LCP, FID/INP).
3. Backend & API Design: RESTful conventions, status codes, middleware, input validation with Pydantic/Zod, and token-based authentication.
4. Database Normalization & Indexing: 3rd Normal Form schema design, foreign key cascades, transaction atomicity (ACID), and using EXPLAIN to inspect query plans.
5. Cloud & Containerization: Packaging services inside lightweight Docker containers, configuring multi-stage Dockerfiles, and deploying to cloud hosts with automated GitHub Actions CI pipelines.
"""
        },
        {
            "title": "AI, Machine Learning & Data Science Career Blueprint",
            "category": "Career Guide",
            "content": """
AI and Machine Learning Placement Preparation Roadmap.
To secure roles as an AI/ML Engineer or Data Scientist:
1. Mathematics Core: Linear algebra (eigenvectors, matrix factorizations), multivariate calculus (gradients, chain rule), and probability distributions (Bayes' theorem, hypothesis testing).
2. Data Wrangling & Exploratory Analysis: Fluent manipulation of high-dimensional datasets using NumPy and Pandas, avoiding in-memory bottlenecks.
3. Applied Machine Learning: Scikit-Learn workflows, hyperparameter tuning, preventing data leakage via Pipelines, and cross-validation strategies.
4. Deep Learning & Generative AI: PyTorch fundamentals, fine-tuning foundation models, building Retrieval-Augmented Generation (RAG) pipelines using vector embeddings, chunking strategies, and semantic vector stores.
5. Production Portfolio: Companies prioritize candidates who have deployed an AI model as an accessible live web application or API rather than just holding a Jupyter notebook.
"""
        },
        {
            "title": "Technical Interview Preparation & Behavioral Playbook",
            "category": "Interview Prep",
            "content": """
The Comprehensive Technical & Behavioral Placement Interview Playbook.
Top Strategies for Technical Rounds:
- Clarify Requirements First: Before writing code, ask clarifying questions regarding input constraints, empty states, duplicate values, and expected time complexity.
- Test with Edge Cases: Walk through your code with null inputs, single-element arrays, and boundary cases before declaring your solution complete.
- Explain Trade-offs: Contrast alternative solutions. For example, 'We can solve this in O(N) time with O(N) space using a hash set, or in O(N log N) time with O(1) space by sorting first.'
Top Strategies for HR & Behavioral Rounds:
- Always use the STAR framework: Situation, Task, Action, and Result.
- For conflict resolution: Focus on objective evidence, customer impact, and respectful consensus rather than personal disagreements.
- Prepare thoughtful questions for the interviewer regarding engineering culture, mentorship, and deployment cycles.
"""
        }
    ]

    for doc in rag_documents:
        existing = db.query(rag_service.__class__).all() if False else None
        # Ingest into RAG service
        rag_service.ingest_document(
            db=db,
            title=doc["title"],
            category=doc["category"],
            content=doc["content"],
            source_filename=f"{doc['title'].lower().replace(' ', '_')}.txt"
        )

    # 5. Seed default Active Roadmap for Alex Chen
    roadmap_service = None
    from app.services.roadmap_service import roadmap_service
    roadmap_service.generate_roadmap(
        user_id=student_user.id,
        career_slug="software-engineer",
        duration_days=60,
        db=db
    )

    db.close()
    print("Database successfully seeded with demo accounts, 9 career paths, 8 jobs, and 4 RAG knowledge documents!")

if __name__ == "__main__":
    seed_database()
