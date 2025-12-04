from datetime import datetime
from typing import Iterable, Sequence

from sqlalchemy import case
from sqlmodel import Session, func, select

from .models import Course, CourseTopic, QuizSubmission, Student, User, UserCourse
from .schemas import (
    AnalyticsByTopic,
    AnalyticsOverview,
    AuthResponse,
    CourseCreate,
    CourseSummary,
    CourseTopicCreate,
    StudentCreate,
    StudentRisk,
    SubmissionCreate,
    UserCreate,
    UserLogin,
)
from .security import hash_password, verify_password


def _normalize_email(email: str | None) -> str | None:
    return email.lower().strip() if email else None


def create_user(session: Session, payload: UserCreate) -> User:
    email = _normalize_email(payload.email)
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise ValueError("User already exists")
    user = User(email=email or payload.email, name=payload.name, hashed_password=hash_password(payload.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, payload: UserLogin) -> User | None:
    email = _normalize_email(payload.email)
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return None
    if not verify_password(payload.password, user.hashed_password):
        return None
    return user


def upsert_courses(session: Session, payload: Iterable[CourseCreate]) -> list[Course]:
    stored: list[Course] = []
    for entry in payload:
        stmt = select(Course).where(Course.name == entry.name, Course.section_number == entry.section_number)
        course = session.exec(stmt).first()
        if course:
            course.description = entry.description
            course.content_manifest = entry.content_manifest
        else:
            course = Course.from_orm(entry)
            session.add(course)
        stored.append(course)
    session.commit()
    for course in stored:
        session.refresh(course)
    return stored


def upsert_topics(session: Session, payload: Iterable[CourseTopicCreate]) -> list[CourseTopic]:
    stored: list[CourseTopic] = []
    for entry in payload:
        stmt = select(CourseTopic).where(
            CourseTopic.title == entry.title,
            CourseTopic.category == entry.category,
            CourseTopic.course_id == entry.course_id,
        )
        topic = session.exec(stmt).first()
        if topic:
            topic.course_id = entry.course_id
        else:
            topic = CourseTopic.from_orm(entry)
            session.add(topic)
        stored.append(topic)
    session.commit()
    for topic in stored:
        session.refresh(topic)
    return stored


def upsert_students(session: Session, payload: Iterable[StudentCreate]) -> list[Student]:
    stored: list[Student] = []
    for entry in payload:
        email = _normalize_email(entry.email)
        stmt = select(Student).where(Student.email == email)
        student = session.exec(stmt).first()
        if student:
            student.name = entry.name
        else:
            student = Student(name=entry.name, email=email or entry.email)
            session.add(student)
        stored.append(student)
    session.commit()
    for student in stored:
        session.refresh(student)
    return stored


def _resolve_student(session: Session, payload: SubmissionCreate) -> Student:
    if payload.student_id:
        student = session.get(Student, payload.student_id)
        if student:
            return student
    email = _normalize_email(payload.student_email)
    if email:
        stmt = select(Student).where(Student.email == email)
        student = session.exec(stmt).first()
        if student:
            return student
    raise ValueError("Student not found; create the student first.")


def _resolve_course(session: Session, payload: SubmissionCreate) -> Course:
    if payload.course_id:
        course = session.get(Course, payload.course_id)
        if course:
            return course
    if payload.course_name:
        stmt = select(Course).where(Course.name == payload.course_name)
        course = session.exec(stmt).first()
        if course:
            return course
    raise ValueError("Course not found; create the course before importing submissions.")


def _resolve_topic(session: Session, payload: SubmissionCreate, course_id: int | None) -> CourseTopic | None:
    if payload.topic_id:
        return session.get(CourseTopic, payload.topic_id)
    if payload.topic_title:
        stmt = select(CourseTopic).where(
            CourseTopic.title == payload.topic_title,
            CourseTopic.category == (payload.topic_category or "General"),
            CourseTopic.course_id == course_id,
        )
        topic = session.exec(stmt).first()
        if topic:
            return topic
        topic = CourseTopic(
            title=payload.topic_title,
            category=payload.topic_category or "General",
            course_id=course_id,
        )
        session.add(topic)
        session.commit()
        session.refresh(topic)
        return topic
    return None


def create_submission(
    session: Session,
    payload: SubmissionCreate,
    ai_probability: float,
) -> QuizSubmission:
    student = _resolve_student(session, payload)
    course = _resolve_course(session, payload)
    topic = _resolve_topic(session, payload, course.id)
    submission = QuizSubmission(
        student_id=student.id,
        course_id=course.id,
        topic_id=topic.id if topic else None,
        answer_text=payload.answer_text,
        ai_probability=ai_probability,
        flagged=ai_probability >= 0.6,
        raw_score=payload.raw_score,
        final_score=payload.final_score,
        exam_type=payload.exam_type or "closed_book",
        source_filename=payload.source_filename,
        source_path=payload.source_path,
        ocr_text=payload.ocr_text,
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return submission


def assign_course_to_user(session: Session, user_id: int, course_id: int, role: str = "instructor") -> UserCourse:
    record = session.exec(
        select(UserCourse).where(UserCourse.user_id == user_id, UserCourse.course_id == course_id)
    ).first()
    if record:
        record.role = role
    else:
        record = UserCourse(user_id=user_id, course_id=course_id, role=role)
        session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_courses(session: Session, user_id: int | None = None) -> list[Course]:
    query = select(Course)
    if user_id:
        query = query.join(UserCourse, UserCourse.course_id == Course.id).where(UserCourse.user_id == user_id)
    return list(session.exec(query).all())


def list_students(session: Session) -> list[Student]:
    return list(session.exec(select(Student)).all())


def list_submissions(session: Session) -> list[QuizSubmission]:
    return list(session.exec(select(QuizSubmission).order_by(QuizSubmission.submitted_at.desc())).all())


def analytics_by_topic(session: Session) -> list[AnalyticsByTopic]:
    stmt = (
        select(
            QuizSubmission.course_id,
            Course.name,
            QuizSubmission.topic_id,
            CourseTopic.title,
            func.avg(QuizSubmission.ai_probability),
            func.sum(case((QuizSubmission.flagged == True, 1), else_=0)).label("flagged_count"),
            func.count(QuizSubmission.id),
        )
        .join(Course, Course.id == QuizSubmission.course_id)
        .outerjoin(CourseTopic, CourseTopic.id == QuizSubmission.topic_id)
        .group_by(QuizSubmission.course_id, Course.name, QuizSubmission.topic_id, CourseTopic.title)
    )
    rows = session.exec(stmt).all()
    results: list[AnalyticsByTopic] = []
    for course_id, course_name, topic_id, topic_title, avg_prob, flagged_count, submission_count in rows:
        results.append(
            AnalyticsByTopic(
                course_id=course_id,
                course_name=course_name,
                topic_id=topic_id,
                topic_title=topic_title,
                average_ai_probability=float(avg_prob or 0),
                flagged_count=int(flagged_count or 0),
                submission_count=int(submission_count or 0),
            )
        )
    return results


def _latest_final_score(session: Session, student_id: int) -> float | None:
    stmt = (
        select(QuizSubmission.final_score)
        .where(QuizSubmission.student_id == student_id, QuizSubmission.final_score.is_not(None))
        .order_by(QuizSubmission.submitted_at.desc())
    )
    return session.exec(stmt).first()


def student_risks(session: Session) -> list[StudentRisk]:
    stmt = (
        select(
            Student.id,
            Student.name,
            Student.email,
            func.count(QuizSubmission.id),
            func.avg(QuizSubmission.ai_probability),
            func.sum(case((QuizSubmission.flagged == True, 1), else_=0)),
        )
        .join(QuizSubmission, QuizSubmission.student_id == Student.id)
        .group_by(Student.id)
    )
    rows = session.exec(stmt).all()
    risks: list[StudentRisk] = []
    for student_id, name, email, submission_count, avg_prob, flagged_count in rows:
        risks.append(
            StudentRisk(
                student_id=student_id,
                student_name=name,
                student_email=email,
                flagged_submissions=int(flagged_count or 0),
                average_ai_probability=float(avg_prob or 0),
                latest_final_score=_latest_final_score(session, student_id),
            )
        )
    risks.sort(key=lambda r: (r.flagged_submissions, r.average_ai_probability), reverse=True)
    return risks


def analytics_overview(session: Session) -> AnalyticsOverview:
    per_topic = analytics_by_topic(session)
    per_topic.sort(key=lambda x: (x.flagged_count, x.average_ai_probability), reverse=True)
    return AnalyticsOverview(
        generated_at=datetime.utcnow(),
        most_risky_courses=per_topic[:10],
        student_risks=student_risks(session)[:15],
    )


def course_summary(session: Session, course_id: int) -> CourseSummary:
    course = session.get(Course, course_id)
    if not course:
        raise ValueError("Course not found")
    total_stmt = select(func.count(QuizSubmission.id)).where(QuizSubmission.course_id == course_id)
    flagged_stmt = select(func.count(QuizSubmission.id)).where(
        QuizSubmission.course_id == course_id, QuizSubmission.flagged == True
    )
    avg_stmt = select(func.avg(QuizSubmission.ai_probability)).where(QuizSubmission.course_id == course_id)
    total_submissions = session.exec(total_stmt).one()
    flagged = session.exec(flagged_stmt).one()
    average_ai = session.exec(avg_stmt).one() or 0
    topic_stats = [stat for stat in analytics_by_topic(session) if stat.course_id == course_id]
    return CourseSummary(
        course_id=course.id,
        course_name=course.name,
        section_number=course.section_number,
        total_submissions=int(total_submissions or 0),
        flagged_submissions=int(flagged or 0),
        average_ai_probability=float(average_ai or 0),
        top_topics=topic_stats[:5],
    )
