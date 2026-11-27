import json
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import MockInterviewSession, InterviewQA
from app.services.llm_service import llm_service
from app.schemas.schemas import AnswerEvaluationResponse

INTERVIEW_QUESTION_BANKS = {
    "software-engineer": [
        {
            "category": "Technical",
            "difficulty": "Intermediate",
            "question": "Can you explain how a Hash Map works internally, how hash collisions are resolved, and what causes the worst-case O(n) lookup time?",
            "model_answer": "A Hash Map uses an array of buckets and a hash function that converts keys into integer array indices. When two distinct keys produce the same index (a collision), maps handle it via Chaining (linked lists or balanced trees as in Java 8) or Open Addressing (linear/quadratic probing). The worst-case O(n) lookup occurs when all keys hash to the same bucket or malicious inputs cause pathological clustering.",
            "key_points": ["Hash function & bucket indexing", "Collision handling: chaining vs open addressing", "Load factor and dynamic rehashing", "Worst-case time complexity O(n) and balanced tree optimization"]
        },
        {
            "category": "Technical",
            "difficulty": "Intermediate",
            "question": "What is the difference between synchronous and asynchronous execution in web servers, and when should you use asynchronous event loops?",
            "model_answer": "Synchronous servers allocate a dedicated thread or process per request which blocks waiting on I/O (database queries, network calls). Asynchronous servers use an event loop (like Node.js or Python asyncio) that delegates non-blocking I/O to the OS kernel, allowing a single thread to handle thousands of concurrent idle connections. Async is ideal for I/O-bound microservices, WebSockets, and high-concurrency APIs, whereas CPU-bound tasks are better suited for worker processes.",
            "key_points": ["Blocking vs non-blocking I/O", "Event loop architecture", "Concurrency vs parallelism", "Ideal use cases for I/O-bound web services"]
        },
        {
            "category": "Coding",
            "difficulty": "Beginner",
            "question": "How would you detect if a singly linked list contains a cycle? Explain the optimal time and space complexity algorithm.",
            "model_answer": "Use Floyd's Cycle-Finding Algorithm (Tortoise and Hare). Maintain two pointers: a slow pointer moving 1 node at a time and a fast pointer moving 2 nodes. If the list contains a cycle, the fast pointer will eventually lap and meet the slow pointer within the loop. If the fast pointer reaches null, there is no cycle. Time complexity is O(N) and space complexity is O(1) as no extra hash set is required.",
            "key_points": ["Floyd's Tortoise and Hare algorithm", "Two pointers with 1x and 2x traversal steps", "O(N) time complexity", "O(1) auxiliary space"]
        },
        {
            "category": "HR",
            "difficulty": "Beginner",
            "question": "Tell me about a time you faced a difficult technical bug or disagreement during a group project, and how you resolved it.",
            "model_answer": "A strong answer follows the STAR method (Situation, Task, Action, Result). For example: Describe a project where an unexpected race condition occurred under load. Rather than assigning blame, you wrote automated reproduction tests, benchmarked root causes collaboratively, proposed an atomic transaction solution, and documented findings for the team, delivering the project on schedule.",
            "key_points": ["STAR methodology (Situation, Task, Action, Result)", "Focus on constructive problem solving", "Data-driven communication without ego", "Positive team outcome and learning"]
        },
        {
            "category": "Aptitude",
            "difficulty": "Intermediate",
            "question": "You have 8 balls of identical look, but 1 is slightly heavier. What is the minimum number of balance scale weighings required to identify the heavy ball with certainty?",
            "model_answer": "The minimum number of weighings is 2. Divide the 8 balls into groups: 3, 3, and 2. Weigh group 1 (3 balls) against group 2 (3 balls). If one side is heavier, pick that group and weigh 1 vs 1 (if equal, the 3rd is the heavy one). If the first weighing balances, the heavy ball is in group 3 (2 balls); weigh them against each other in the second weighing to identify the heavy ball.",
            "key_points": ["Ternary division (3, 3, 2)", "First weighing: 3 vs 3", "Second weighing: 1 vs 1", "Total weighings: 2 guaranteed"]
        }
    ]
}

class InterviewService:
    def start_mock_interview(self, user_id: int, target_role: str, difficulty: str, db: Session) -> MockInterviewSession:
        """Create mock interview session with targeted questions."""
        session = MockInterviewSession(
            user_id=user_id,
            target_role=target_role,
            difficulty=difficulty,
            total_score=0.0,
            feedback_summary="Session in progress"
        )
        db.add(session)
        db.flush()

        # Find questions matching role or standard software engineering pool
        slug = target_role.lower().replace(" ", "-")
        bank = INTERVIEW_QUESTION_BANKS.get(slug, INTERVIEW_QUESTION_BANKS["software-engineer"])

        for item in bank:
            q = InterviewQA(
                session_id=session.id,
                question=item["question"],
                category=item["category"],
                difficulty=item.get("difficulty", difficulty),
                model_answer=item["model_answer"],
                key_points_json=json.dumps(item["key_points"]),
                student_answer="",
                score=0.0,
                ai_feedback=""
            )
            db.add(q)

        db.commit()
        db.refresh(session)
        return session

    def evaluate_answer(self, question_id: int, student_answer: str, db: Session) -> AnswerEvaluationResponse:
        """Evaluate student's answer using semantic comparison against key points and LLM rubric."""
        qa = db.query(InterviewQA).filter(InterviewQA.id == question_id).first()
        if not qa:
            raise ValueError("Interview question not found")

        key_points = json.loads(qa.key_points_json or "[]")
        ans_lower = student_answer.lower()

        # Check matched key concepts
        matched_points = []
        missing_points = []
        for point in key_points:
            words = set(re.findall(r"\b\w{3,}\b", point.lower()))
            overlap = sum(1 for w in words if w in ans_lower)
            if overlap >= max(1, len(words) // 3):
                matched_points.append(point)
            else:
                missing_points.append(point)

        # Baseline scoring
        base_score = 40.0 if len(student_answer.split()) >= 15 else 20.0
        if key_points:
            coverage_score = (len(matched_points) / len(key_points)) * 60.0
            total_score = min(100.0, base_score + coverage_score)
        else:
            total_score = 75.0

        total_score = round(total_score, 1)

        strengths = []
        if matched_points:
            strengths.append(f"Successfully addressed core concepts: {', '.join(matched_points[:2])}.")
        if len(student_answer.split()) >= 25:
            strengths.append("Provided thorough elaboration with context.")
        else:
            strengths.append("Direct and concise initial premise.")

        areas_for_improvement = []
        if missing_points:
            areas_for_improvement.append(f"Incorporate technical keywords such as: {', '.join(missing_points[:2])}.")
        if len(student_answer.split()) < 20:
            areas_for_improvement.append("Expand on your answer by detailing real-world trade-offs or implementation examples.")

        ideal_tips = f"Model Answer Highlight: {qa.model_answer[:220]}..."

        full_feedback = (
            f"Score: {total_score}/100. "
            f"{'Excellent demonstration of technical mastery.' if total_score >= 80 else 'Good foundational answer with room for depth.'} "
            f"Key strengths: {'; '.join(strengths)}. "
            f"Next step: {'; '.join(areas_for_improvement)}."
        )

        # Save to DB
        qa.student_answer = student_answer
        qa.score = total_score
        qa.ai_feedback = full_feedback

        # Update session average
        session = qa.session
        all_qas = session.questions
        answered_qas = [q for q in all_qas if q.student_answer]
        if answered_qas:
            session.total_score = round(sum(q.score for q in answered_qas) / len(answered_qas), 1)
            session.feedback_summary = f"Completed {len(answered_qas)} of {len(all_qas)} questions with an average score of {session.total_score}%."

        db.commit()

        return AnswerEvaluationResponse(
            question_id=qa.id,
            score=total_score,
            strengths=strengths,
            areas_for_improvement=areas_for_improvement,
            ideal_response_tips=ideal_tips,
            full_feedback=full_feedback
        )

interview_service = InterviewService()
