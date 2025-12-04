from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import crud
from ..database import get_session
from ..schemas import CourseCreate, CourseRead, CourseSummary, CourseTopicCreate, CourseTopicRead

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseRead])
def list_courses(
    user_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[CourseRead]:
    return [CourseRead.from_orm(c) for c in crud.list_courses(session, user_id=user_id)]


@router.post("/import", response_model=list[CourseRead])
def import_courses(
    payload: list[CourseCreate],
    session: Session = Depends(get_session),
) -> list[CourseRead]:
    if not payload:
        raise HTTPException(status_code=400, detail="Payload is empty")
    courses = crud.upsert_courses(session, payload)
    return [CourseRead.from_orm(c) for c in courses]


@router.post("/topics/import", response_model=list[CourseTopicRead])
def import_topics(
    payload: list[CourseTopicCreate],
    session: Session = Depends(get_session),
) -> list[CourseTopicRead]:
    if not payload:
        raise HTTPException(status_code=400, detail="Payload is empty")
    topics = crud.upsert_topics(session, payload)
    return [CourseTopicRead.from_orm(t) for t in topics]


@router.post("/{course_id}/assign/{user_id}")
def assign_course(
    course_id: int,
    user_id: int,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    crud.assign_course_to_user(session, user_id=user_id, course_id=course_id)
    return {"status": "assigned"}


@router.get("/{course_id}/summary", response_model=CourseSummary)
def summary(course_id: int, session: Session = Depends(get_session)) -> CourseSummary:
    try:
        return crud.course_summary(session, course_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
