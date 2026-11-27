import io
import re
from typing import Dict, Any, List, Tuple
from pypdf import PdfReader

# Master skill taxonomy for precise extraction
TECHNICAL_SKILLS_TAXONOMY = {
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "R", "Dart", "Scala", "HTML", "CSS", "SQL",
    # Frameworks & Libraries
    "React", "Next.js", "Node.js", "Express.js", "Angular", "Vue.js", "Django", "FastAPI", "Flask", "Spring Boot", "ASP.NET", ".NET", "Tailwind CSS", "Redux", "Bootstrap",
    # Data Science, AI & ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "OpenCV", "NLP", "Computer Vision", "Keras", "Matplotlib", "Seaborn", "LangChain", "RAG", "LLM", "Hugging Face", "ChromaDB", "FAISS",
    # Cloud, DevOps & Tools
    "AWS", "Azure", "Google Cloud", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", "Linux", "Terraform", "Jenkins", "Nginx", "Kubernetes",
    # Databases & Storage
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Cassandra", "DynamoDB", "Firebase", "Supabase", "Elasticsearch",
    # QA & Testing
    "Selenium", "Jest", "Cypress", "PyTest", "JUnit", "Postman", "Playwright",
    # Cybersecurity & Networking
    "Network Security", "Penetration Testing", "Cryptography", "OWASP", "Wireshark", "Firewalls", "SIEM", "SOC"
}

SOFT_SKILLS_TAXONOMY = {
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Critical Thinking",
    "Adaptability", "Time Management", "Collaboration", "Presentation", "Work Ethic",
    "Agile Methodology", "Scrum", "Conflict Resolution", "Analytical Thinking", "Attention to Detail"
}

class ResumeService:
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract plain text from uploaded PDF bytes."""
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF resume: {str(e)}")

    def analyze_resume(self, text: str) -> Dict[str, Any]:
        """Perform comprehensive resume analysis and compute readiness score."""
        text_lower = text.lower()

        # 1. Extract Skills
        extracted_tech = self._extract_skills(text, TECHNICAL_SKILLS_TAXONOMY)
        extracted_soft = self._extract_skills(text, SOFT_SKILLS_TAXONOMY)

        # 2. Section Checks
        sections_found = {
            "contact_info": bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text) or re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)),
            "education": bool(re.search(r"\b(education|b\.?tech|bachelor|master|m\.?tech|degree|university|college|cgpa|gpa)\b", text_lower)),
            "skills": bool(re.search(r"\b(skills|technical skills|technologies|proficiencies|competencies)\b", text_lower)),
            "projects": bool(re.search(r"\b(projects|academic projects|portfolio|personal projects)\b", text_lower)),
            "experience": bool(re.search(r"\b(experience|internship|employment|work history|professional experience)\b", text_lower)),
            "certifications": bool(re.search(r"\b(certifications|certificates|licenses|courses|accreditation)\b", text_lower)),
        }

        # 3. Detect Missing Sections
        missing_sections = [name.replace("_", " ").title() for name, found in sections_found.items() if not found]

        # 4. Action Verbs & Metrics Detection
        action_verbs = ["developed", "engineered", "built", "implemented", "designed", "optimized", "spearheaded", "orchestrated", "automated", "created", "reduced", "increased"]
        action_verb_count = sum(1 for verb in action_verbs if verb in text_lower)
        has_metrics = bool(re.search(r"\b\d+%\b|\b\d+x\b|\b\$\d+|\b\d+\s*(users|clients|seconds|ms|queries)\b", text_lower))

        # 5. Calculate Score Rubric (0 to 100)
        # - Contact & Summary: 10 pts
        # - Education & Academics: 15 pts
        # - Technical Skills breadth: 25 pts
        # - Projects & Work Experience: 30 pts
        # - Action Verbs & Quantifiable Metrics: 20 pts
        score = 0.0

        # Contact & Education
        if sections_found["contact_info"]: score += 10
        if sections_found["education"]: score += 15

        # Technical Skills
        tech_count = len(extracted_tech)
        if tech_count >= 8:
            score += 25
        elif tech_count >= 5:
            score += 18
        elif tech_count >= 2:
            score += 10
        elif tech_count >= 1:
            score += 5

        # Projects and Experience
        if sections_found["projects"]:
            score += 18
        if sections_found["experience"]:
            score += 12
        elif sections_found["projects"] and tech_count >= 6:
            score += 6 # compensation for freshers with great projects

        # Metrics & Action Verbs
        if action_verb_count >= 4:
            score += 10
        elif action_verb_count >= 2:
            score += 6
        
        if has_metrics:
            score += 10
        elif action_verb_count >= 3:
            score += 5

        readiness_score = min(round(score, 1), 100.0)

        # 6. Strengths
        strengths = []
        if tech_count >= 6:
            strengths.append(f"Strong technical footprint with {tech_count} industry-standard skills identified.")
        if sections_found["projects"]:
            strengths.append("Dedicated project portfolio section included, demonstrating applied software skills.")
        if has_metrics:
            strengths.append("Contains quantifiable results and impact metrics (percentages, scale, or performance gains).")
        if action_verb_count >= 3:
            strengths.append("Uses dynamic, impactful engineering action verbs (engineered, optimized, automated).")
        if not strengths:
            strengths.append("Clean baseline structure with essential academic credentials.")

        # 7. Actionable Improvement Suggestions
        suggestions = []
        if "Experience" in missing_sections and "Projects" in missing_sections:
            suggestions.append({
                "category": "High Priority",
                "message": "Add a prominent 'Projects & Practical Work' section highlighting full-stack or data projects with GitHub links."
            })
        if not has_metrics:
            suggestions.append({
                "category": "Impact",
                "message": "Quantify project accomplishments using XYZ formula: 'Accomplished [X] measured by [Y] by doing [Z]' (e.g., 'Reduced API latency by 35%')."
            })
        if tech_count < 6:
            suggestions.append({
                "category": "Skills Enhancement",
                "message": "Expand your technical skills list to include modern tools like Docker, Git, CI/CD, or cloud platforms (AWS/GCP)."
            })
        if "Certifications" in missing_sections:
            suggestions.append({
                "category": "Credentials",
                "message": "Consider earning and displaying industry certifications (e.g. AWS Certified Cloud Practitioner, Meta Front-End, or DeepLearning.AI)."
            })
        suggestions.append({
            "category": "ATS Optimization",
            "message": "Ensure keywords from targeted job descriptions are woven naturally into your project bullet points."
        })

        # 8. Detailed Section Breakdown Scores
        section_scores = {
            "Contact & Heading": 10.0 if sections_found["contact_info"] else 3.0,
            "Education & Academics": 15.0 if sections_found["education"] else 5.0,
            "Technical Skills": min(25.0, round(tech_count * 3.0, 1)),
            "Projects & Experience": 30.0 if (sections_found["projects"] and sections_found["experience"]) else (20.0 if sections_found["projects"] else 8.0),
            "Impact & Action Verbs": 20.0 if (has_metrics and action_verb_count >= 3) else 10.0,
        }

        # 9. Extract estimated education details
        cgpa_match = re.search(r"\b(?:cgpa|gpa)[\s:]*([0-9]\.[0-9]{1,2}|10\.0|[0-9]{1,2}(?:\.[0-9])?)\b", text_lower)
        detected_cgpa = float(cgpa_match.group(1)) if cgpa_match else None

        return {
            "readiness_score": readiness_score,
            "extracted_technical_skills": sorted(list(extracted_tech)),
            "extracted_soft_skills": sorted(list(extracted_soft)),
            "education_detected": {
                "cgpa": detected_cgpa,
                "has_degree_mention": sections_found["education"]
            },
            "projects_detected": [{"name": "Detected Projects", "present": sections_found["projects"]}],
            "experience_detected": [{"name": "Detected Experience", "present": sections_found["experience"]}],
            "strengths": strengths,
            "missing_sections": missing_sections,
            "improvement_suggestions": suggestions,
            "section_scores": section_scores,
        }

    def _extract_skills(self, text: str, taxonomy: set) -> set:
        """Accurately match skills preserving word boundaries."""
        found = set()
        text_padded = f" {text.lower()} "
        for skill in taxonomy:
            pattern = rf"(?<![a-zA-Z0-9_#\+\.\-]){re.escape(skill.lower())}(?![a-zA-Z0-9_#\+\.\-])"
            if re.search(pattern, text_padded):
                found.add(skill)
        return found

resume_service = ResumeService()
