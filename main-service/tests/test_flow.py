from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_end_to_end_course_flow():
    app = create_app()
    with TestClient(app) as client:
        signup_resp = client.post(
            "/auth/signup",
            json={"email": "prof@example.edu", "password": "super-secret", "name": "Professor Test"},
        )
        assert signup_resp.status_code == 200
        auth = signup_resp.json()
        user_id = auth["user_id"]

        courses_resp = client.post(
            "/courses/import",
            json=[
                {"name": "Software Quality", "section_number": 1, "description": "QA focus"},
                {"name": "Secure Coding", "section_number": 2, "description": "AppSec focus"},
            ],
        )
        assert courses_resp.status_code == 200
        courses = courses_resp.json()
        assert len(courses) == 2
        course_id = courses[0]["id"]

        assign_resp = client.post(f"/courses/{course_id}/assign/{user_id}")
        assert assign_resp.status_code == 200
        assert assign_resp.json() == {"status": "assigned"}

        students_payload = [
            {"name": "Alice Example", "email": "alice@example.edu"},
            {"name": "Bob Example", "email": "bob@example.edu"},
        ]
        students_resp = client.post("/students/import", json=students_payload)
        assert students_resp.status_code == 200
        assert len(students_resp.json()) == len(students_payload)

        submissions_payload = [
            {
                "student_email": "alice@example.edu",
                "course_id": course_id,
                "topic_title": "Unit Testing",
                "topic_category": "Process",
                "answer_text": "Students discuss TDD and coverage best practices.",
                "final_score": 88,
                "exam_type": "midterm",
            },
            {
                "student_email": "bob@example.edu",
                "course_id": course_id,
                "topic_title": "Risk Analysis",
                "topic_category": "Security",
                "answer_text": "Focuses on STRIDE risk tables and mitigations.",
                "final_score": 62,
                "exam_type": "final",
            },
        ]
        submissions_resp = client.post("/submissions/import", json=submissions_payload)
        assert submissions_resp.status_code == 200
        created_submissions = submissions_resp.json()
        assert len(created_submissions) == len(submissions_payload)
        assert all(
            0 <= float(row["ai_probability"]) <= 1 and isinstance(row["flagged"], bool)
            for row in created_submissions
        )

        list_sub_resp = client.get("/submissions")
        assert list_sub_resp.status_code == 200
        assert len(list_sub_resp.json()) == len(submissions_payload)

        instructor_courses = client.get("/courses", params={"user_id": user_id})
        assert instructor_courses.status_code == 200
        assigned = instructor_courses.json()
        assert len(assigned) == 1 and assigned[0]["id"] == course_id

        topics_resp = client.get("/courses/topics")
        assert topics_resp.status_code == 200
        topic_titles = {topic["title"] for topic in topics_resp.json()}
        assert {"Unit Testing", "Risk Analysis"} <= topic_titles

        summary_resp = client.get(f"/courses/{course_id}/summary")
        assert summary_resp.status_code == 200
        summary = summary_resp.json()
        assert summary["total_submissions"] == len(submissions_payload)
        assert summary["flagged_submissions"] == sum(1 for row in created_submissions if row["flagged"])

        overview_resp = client.get("/analytics/overview")
        assert overview_resp.status_code == 200
        overview = overview_resp.json()
        assert overview["most_risky_courses"]
        assert overview["student_risks"]

        analytics_topics_resp = client.get("/analytics/topics")
        assert analytics_topics_resp.status_code == 200
        analytics_topics = analytics_topics_resp.json()
        assert any(
            topic["course_id"] == course_id and topic["submission_count"] >= 1 for topic in analytics_topics
        )

        detection_resp = client.post("/api/detect", json={"text": "LLM usage detection sample prompt."})
        assert detection_resp.status_code == 200
        detection = detection_resp.json()
        assert 0 <= detection["prob_ai"] <= 1
        assert detection["label"] in {"ai", "human"}
