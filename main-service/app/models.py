from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class UserBase(SQLModel):
    email: str
    name: Optional[str] = None


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    courses: list["UserCourse"] = Relationship(back_populates="user")


class UserCourse(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    course_id: Optional[int] = Field(default=None, foreign_key="course.id", primary_key=True)
    role: str = Field(default="instructor")
    user: Optional[User] = Relationship(back_populates="courses")
    course: Optional["Course"] = Relationship(back_populates="lecturers")


class CourseBase(SQLModel):
    name: str
    section_number: Optional[int] = None
    description: Optional[str] = None


class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content_manifest: Optional[str] = Field(
        default=None, description="JSON describing uploaded course content assets"
    )
    topics: list["CourseTopic"] = Relationship(back_populates="course")
    submissions: list["QuizSubmission"] = Relationship(back_populates="course")
    lecturers: list[UserCourse] = Relationship(back_populates="course")


class CourseTopicBase(SQLModel):
    title: str
    category: str
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")


class CourseTopic(CourseTopicBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course: Optional[Course] = Relationship(back_populates="topics")
    submissions: list["QuizSubmission"] = Relationship(back_populates="topic")


class StudentBase(SQLModel):
    name: str
    email: str


class Student(StudentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    submissions: list["QuizSubmission"] = Relationship(back_populates="student")


class QuizSubmissionBase(SQLModel):
    student_id: int = Field(foreign_key="student.id")
    course_id: int = Field(foreign_key="course.id")
    topic_id: Optional[int] = Field(default=None, foreign_key="coursetopic.id")
    answer_text: str
    ai_probability: float = 0.0
    flagged: bool = False
    raw_score: Optional[float] = Field(default=None, description="Score for the quiz/test")
    final_score: Optional[float] = Field(
        default=None, description="Course final score to correlate with AI usage"
    )
    exam_type: Optional[str] = Field(default="closed_book")
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    source_filename: Optional[str] = Field(
        default=None, description="Original filename for traceability"
    )
    source_path: Optional[str] = Field(default=None, description="Server path for uploaded file")
    ocr_text: Optional[str] = Field(default=None, description="Raw OCR output if extracted from PDF")


class QuizSubmission(QuizSubmissionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student: Student = Relationship(back_populates="submissions")
    course: Course = Relationship(back_populates="submissions")
    topic: Optional[CourseTopic] = Relationship(back_populates="submissions")
