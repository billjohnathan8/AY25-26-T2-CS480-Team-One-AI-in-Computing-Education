from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from sqlmodel import SQLModel


class Message(BaseModel):
    detail: str


class AuthResponse(BaseModel):
    token: str
    user_id: int


class UserCreate(SQLModel):
    email: str
    password: str
    name: Optional[str] = None


class UserLogin(SQLModel):
    email: str
    password: str


class CourseCreate(SQLModel):
    name: str
    section_number: Optional[int] = None
    description: Optional[str] = None
    content_manifest: Optional[str] = None


class CourseRead(CourseCreate):
    id: int


class CourseTopicCreate(SQLModel):
    title: str
    category: str
    course_id: Optional[int] = None


class CourseTopicRead(CourseTopicCreate):
    id: int


class StudentCreate(SQLModel):
    name: str
    email: str


class StudentRead(StudentCreate):
    id: int


class SubmissionCreate(SQLModel):
    student_id: Optional[int] = None
    student_email: Optional[str] = Field(default=None, description="Fallback lookup")
    course_id: Optional[int] = None
    course_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_title: Optional[str] = None
    topic_category: Optional[str] = None
    answer_text: str
    raw_score: Optional[float] = None
    final_score: Optional[float] = None
    exam_type: Optional[str] = None
    source_filename: Optional[str] = None
    source_path: Optional[str] = None
    ocr_text: Optional[str] = None


class SubmissionRead(SQLModel):
    id: int
    student_id: int
    course_id: int
    topic_id: Optional[int]
    answer_text: str
    ai_probability: float
    flagged: bool
    raw_score: Optional[float]
    final_score: Optional[float]
    exam_type: Optional[str]
    submitted_at: datetime
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    course_name: Optional[str] = None
    topic_title: Optional[str] = None
    topic_category: Optional[str] = None
    source_filename: Optional[str] = None
    source_path: Optional[str] = None


class AnalyticsByTopic(BaseModel):
    course_id: int
    course_name: str
    topic_id: Optional[int] = None
    topic_title: Optional[str] = None
    average_ai_probability: float
    flagged_count: int
    submission_count: int


class StudentRisk(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    flagged_submissions: int
    average_ai_probability: float
    latest_final_score: Optional[float]


class AnalyticsOverview(BaseModel):
    generated_at: datetime
    most_risky_courses: list[AnalyticsByTopic]
    student_risks: list[StudentRisk]


class CourseSummary(BaseModel):
    course_id: int
    course_name: str
    section_number: Optional[int]
    total_submissions: int
    flagged_submissions: int
    average_ai_probability: float
    top_topics: list[AnalyticsByTopic]
