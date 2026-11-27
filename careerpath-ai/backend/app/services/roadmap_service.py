import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import LearningRoadmap, RoadmapMilestone, CareerRole, StudentProfile

# Curated weekly curricula for top roles
ROLE_CURRICULUM_TEMPLATES = {
    "software-engineer": [
        {
            "week": 1,
            "title": "Data Structures & Algorithmic Foundations",
            "description": "Master core computational complexities, memory representations, arrays, hash maps, and two-pointer techniques.",
            "skills": ["Algorithms", "Big-O Notation", "Arrays", "Hash Tables"],
            "tasks": [
                {"id": "t1", "task": "Review Big-O time and space complexity analysis", "completed": False},
                {"id": "t2", "task": "Solve 10 LeetCode Easy/Medium array and two-pointer problems", "completed": False},
                {"id": "t3", "task": "Implement a custom Hash Table collision-resolution structure", "completed": False}
            ],
            "resources": [
                {"title": "NeetCode 150 Roadmap", "url": "https://neetcode.io/roadmap", "type": "Interactive Guide"},
                {"title": "MIT 6.006 Introduction to Algorithms", "url": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms/", "type": "Course"}
            ]
        },
        {
            "week": 2,
            "title": "Object-Oriented Design & Clean Architecture",
            "description": "Implement SOLID principles, creational and structural design patterns in your primary programming language.",
            "skills": ["OOP", "SOLID", "Design Patterns", "Clean Code"],
            "tasks": [
                {"id": "t4", "task": "Design a parking lot or library management system using OOP", "completed": False},
                {"id": "t5", "task": "Refactor a monolithic script into modular classes with unit tests", "completed": False},
                {"id": "t6", "task": "Write test suites using PyTest or JUnit with >85% coverage", "completed": False}
            ],
            "resources": [
                {"title": "Refactoring Guru - Design Patterns", "url": "https://refactoring.guru/design-patterns", "type": "Documentation"}
            ]
        },
        {
            "week": 3,
            "title": "Relational Databases, SQL & Query Optimization",
            "description": "Deep dive into schema normalization, indexing, ACID transactions, and query plan analysis.",
            "skills": ["PostgreSQL", "SQL", "Indexing", "Transactions"],
            "tasks": [
                {"id": "t7", "task": "Write multi-table complex JOINs, GROUP BY and Window Functions", "completed": False},
                {"id": "t8", "task": "Analyze EXPLAIN ANALYZE execution plans and add B-Tree indexes", "completed": False},
                {"id": "t9", "task": "Implement database migrations with Alembic or Prisma", "completed": False}
            ],
            "resources": [
                {"title": "Use The Index, Luke! SQL Indexing Guide", "url": "https://use-the-index-luke.com/", "type": "Interactive Guide"}
            ]
        },
        {
            "week": 4,
            "title": "REST APIs, Backend Microservices & Deployment",
            "description": "Build high-throughput asynchronous RESTful web services with authentication, rate limiting, and Docker containerization.",
            "skills": ["FastAPI", "Docker", "Authentication", "Git CI/CD"],
            "tasks": [
                {"id": "t10", "task": "Build and containerize a secure JWT authenticated microservice", "completed": False},
                {"id": "t11", "task": "Write Dockerfile and docker-compose.yml configuration", "completed": False},
                {"id": "t12", "task": "Deploy backend service to cloud provider with automated CI pipeline", "completed": False}
            ],
            "resources": [
                {"title": "FastAPI Deployment Documentation", "url": "https://fastapi.tiangolo.com/deployment/", "type": "Documentation"}
            ]
        }
    ],
    "full-stack-developer": [
        {
            "week": 1,
            "title": "Modern TypeScript & Advanced React Foundations",
            "description": "Master component lifecycles, custom hooks, context state management, and strict TypeScript interfaces.",
            "skills": ["React", "TypeScript", "Tailwind CSS", "State Management"],
            "tasks": [
                {"id": "fs1", "task": "Configure strict TypeScript project with ESLint and Prettier", "completed": False},
                {"id": "fs2", "task": "Build reusable UI component library with accessible Tailwind styling", "completed": False},
                {"id": "fs3", "task": "Implement complex custom React hooks for async API fetching and caching", "completed": False}
            ],
            "resources": [
                {"title": "React.dev Interactive Guide", "url": "https://react.dev", "type": "Documentation"}
            ]
        },
        {
            "week": 2,
            "title": "Full-Stack Server Rendering & Next.js Architecture",
            "description": "Server Components, Server Actions, Dynamic Routing, and SEO optimization in Next.js App Router.",
            "skills": ["Next.js", "Server Components", "API Routes", "SSR"],
            "tasks": [
                {"id": "fs4", "task": "Build a responsive multi-page web application using Next.js App Router", "completed": False},
                {"id": "fs5", "task": "Implement Server Actions with Zod data validation and optimistic UI", "completed": False},
                {"id": "fs6", "task": "Configure dynamic OG images and metadata for SEO performance", "completed": False}
            ],
            "resources": [
                {"title": "Official Next.js App Router Learn Course", "url": "https://nextjs.org/learn", "type": "Tutorial"}
            ]
        },
        {
            "week": 3,
            "title": "Database Integration, ORM & Real-Time State",
            "description": "Connect PostgreSQL with Prisma / SQLAlchemy, build secure REST/GraphQL endpoints, and WebSocket sync.",
            "skills": ["PostgreSQL", "Prisma", "WebSockets", "Node.js"],
            "tasks": [
                {"id": "fs7", "task": "Design multi-tenant database schema with foreign keys and cascades", "completed": False},
                {"id": "fs8", "task": "Build secure CRUD endpoints with role-based authorization checks", "completed": False},
                {"id": "fs9", "task": "Implement live notification updates using WebSockets", "completed": False}
            ],
            "resources": [
                {"title": "Prisma Data Modeling Best Practices", "url": "https://www.prisma.io/docs", "type": "Documentation"}
            ]
        },
        {
            "week": 4,
            "title": "Full-Stack Production Capstone & Cloud CI/CD",
            "description": "Deliver a production-ready portfolio web application with payment integration, automated tests, and Vercel/Docker deployment.",
            "skills": ["DevOps", "Testing", "Vercel", "Monitoring"],
            "tasks": [
                {"id": "fs10", "task": "Write end-to-end integration tests using Playwright", "completed": False},
                {"id": "fs11", "task": "Configure automated GitHub Actions CI pipeline for linting & tests", "completed": False},
                {"id": "fs12", "task": "Deploy live production app and publish repository with detailed README", "completed": False}
            ],
            "resources": [
                {"title": "Playwright Testing Guide", "url": "https://playwright.dev/docs/intro", "type": "Documentation"}
            ]
        }
    ],
    "ai-ml-engineer": [
        {
            "week": 1,
            "title": "Mathematical Foundations, NumPy & Data Manipulation",
            "description": "Linear algebra, matrix operations, statistical modeling, Pandas data wrangling, and exploratory analysis.",
            "skills": ["Python", "NumPy", "Pandas", "Statistics"],
            "tasks": [
                {"id": "ai1", "task": "Implement matrix operations and gradient descent from scratch in NumPy", "completed": False},
                {"id": "ai2", "task": "Perform EDA on 100k+ record dataset with Matplotlib and Seaborn", "completed": False},
                {"id": "ai3", "task": "Clean missing values, handle categorical encoding and feature scaling", "completed": False}
            ],
            "resources": [
                {"title": "3Blue1Brown Essence of Linear Algebra", "url": "https://www.3blue1brown.com/topics/linear-algebra", "type": "Video"}
            ]
        },
        {
            "week": 2,
            "title": "Classical Machine Learning & Cross-Validation",
            "description": "Supervised/unsupervised algorithms: XGBoost, Random Forests, SVMs, hyperparameter tuning with Optuna.",
            "skills": ["Scikit-Learn", "XGBoost", "Model Evaluation", "Cross-Validation"],
            "tasks": [
                {"id": "ai4", "task": "Train and evaluate classification & regression models using Scikit-Learn", "completed": False},
                {"id": "ai5", "task": "Prevent data leakage using Scikit-Learn Pipelines and ColumnTransformer", "completed": False},
                {"id": "ai6", "task": "Optimize hyperparameters with 5-fold Stratified Cross-Validation", "completed": False}
            ],
            "resources": [
                {"title": "Scikit-Learn Model Evaluation Guide", "url": "https://scikit-learn.org/stable/modules/model_evaluation.html", "type": "Documentation"}
            ]
        },
        {
            "week": 3,
            "title": "Deep Learning & Neural Networks with PyTorch",
            "description": "Tensors, autograd, backpropagation, CNNs for computer vision, and Transformer architectures.",
            "skills": ["PyTorch", "Deep Learning", "Transformers", "Transfer Learning"],
            "tasks": [
                {"id": "ai7", "task": "Build custom PyTorch Dataset, DataLoader, and training loop with GPU acceleration", "completed": False},
                {"id": "ai8", "task": "Fine-tune a pre-trained ResNet/Vision Transformer on custom image dataset", "completed": False},
                {"id": "ai9", "task": "Track loss and accuracy metrics using Weights & Biases or TensorBoard", "completed": False}
            ],
            "resources": [
                {"title": "Deep Learning with PyTorch (Official 60-Minute Blitz)", "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html", "type": "Tutorial"}
            ]
        },
        {
            "week": 4,
            "title": "Generative AI, LLMs, RAG Pipelines & Model Serving",
            "description": "Build end-to-end RAG systems with LangChain/Gemini API, vector databases, and deploy as high-performance inference APIs.",
            "skills": ["LLM", "RAG", "LangChain", "FastAPI", "Vector DB"],
            "tasks": [
                {"id": "ai10", "task": "Build an intelligent document question-answering system using vector search", "completed": False},
                {"id": "ai11", "task": "Implement semantic chunking and source attribution with Gemini / OpenAI API", "completed": False},
                {"id": "ai12", "task": "Deploy PyTorch/ONNX inference model in a FastAPI container", "completed": False}
            ],
            "resources": [
                {"title": "Hugging Face NLP Course", "url": "https://huggingface.co/learn/nlp-course", "type": "Course"}
            ]
        }
    ]
}

class RoadmapService:
    def generate_roadmap(self, user_id: int, career_slug: str, duration_days: int, db: Session) -> LearningRoadmap:
        """Create or refresh a structured learning roadmap for a student."""
        # Find role info
        role = db.query(CareerRole).filter(CareerRole.slug == career_slug).first()
        role_title = role.title if role else career_slug.replace("-", " ").title()

        # Check existing roadmap for this role or replace
        existing = db.query(LearningRoadmap).filter(
            LearningRoadmap.user_id == user_id,
            LearningRoadmap.career_role_slug == career_slug
        ).first()

        if existing:
            return existing

        roadmap = LearningRoadmap(
            user_id=user_id,
            career_role_slug=career_slug,
            target_role_title=role_title,
            duration_days=duration_days,
            overall_progress=0.0
        )
        db.add(roadmap)
        db.flush()

        # Pick base curriculum
        template = ROLE_CURRICULUM_TEMPLATES.get(career_slug, ROLE_CURRICULUM_TEMPLATES["software-engineer"])
        
        # Scale weeks based on duration: 30 days = 4 weeks, 60 days = 8 weeks, 90 days = 12 weeks
        weeks_count = 4 if duration_days <= 30 else (8 if duration_days <= 60 else 12)
        
        for w in range(1, weeks_count + 1):
            base_idx = (w - 1) % len(template)
            base_milestone = template[base_idx]

            title = f"Week {w}: {base_milestone['title']}" if w <= 4 else f"Week {w}: Advanced {base_milestone['skills'][0]} & Capstone Execution"
            desc = base_milestone['description']
            
            tasks = []
            for t in base_milestone['tasks']:
                tasks.append({
                    "id": f"w{w}_{t['id']}",
                    "task": t['task'] if w <= 4 else f"Production Sprint: {t['task']}",
                    "completed": False
                })

            milestone = RoadmapMilestone(
                roadmap_id=roadmap.id,
                week_number=w,
                title=title,
                description=desc,
                skills_json=json.dumps(base_milestone['skills']),
                tasks_json=json.dumps(tasks),
                resources_json=json.dumps(base_milestone['resources']),
                is_completed=False
            )
            db.add(milestone)

        db.commit()
        db.refresh(roadmap)
        return roadmap

    def toggle_task(self, roadmap_id: int, milestone_id: int, task_id: str, completed: bool, db: Session) -> LearningRoadmap:
        """Toggle completion status of a task and recalculate overall progress."""
        milestone = db.query(RoadmapMilestone).filter(
            RoadmapMilestone.id == milestone_id,
            RoadmapMilestone.roadmap_id == roadmap_id
        ).first()
        if not milestone:
            raise ValueError("Milestone not found")

        tasks = json.loads(milestone.tasks_json or "[]")
        for t in tasks:
            if t["id"] == task_id:
                t["completed"] = completed

        milestone.tasks_json = json.dumps(tasks)
        milestone.is_completed = all(t.get("completed", False) for t in tasks) if tasks else False

        # Recalculate roadmap overall progress
        all_milestones = db.query(RoadmapMilestone).filter(RoadmapMilestone.roadmap_id == roadmap_id).all()
        total_tasks = 0
        completed_tasks = 0
        for m in all_milestones:
            m_tasks = json.loads(m.tasks_json or "[]")
            total_tasks += len(m_tasks)
            completed_tasks += sum(1 for item in m_tasks if item.get("completed", False))

        roadmap = db.query(LearningRoadmap).filter(LearningRoadmap.id == roadmap_id).first()
        if total_tasks > 0:
            roadmap.overall_progress = round((completed_tasks / total_tasks) * 100.0, 1)
        else:
            roadmap.overall_progress = 0.0

        db.commit()
        db.refresh(roadmap)
        return roadmap

roadmap_service = RoadmapService()
