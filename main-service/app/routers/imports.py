from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session

from .. import crud
from ..database import get_session
from ..routers.submissions import _fetch_ai_probability  # reuse detection pipeline client
from ..schemas import CourseRead, StudentRead, SubmissionRead
from ..services.file_ingestion import (
    parse_courses_from_file,
    parse_students_from_file,
    parse_submissions_file,
)

router = APIRouter(prefix="/import-file", tags=["file-imports"])


@router.post("/courses", response_model=list[CourseRead])
async def upload_courses(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> list[CourseRead]:
    contents = await file.read()
    try:
        courses_payload = parse_courses_from_file(contents, file.filename or "courses")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    courses = crud.upsert_courses(session, courses_payload)
    return [CourseRead.from_orm(course) for course in courses]


@router.post("/students", response_model=list[StudentRead])
async def upload_students(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> list[StudentRead]:
    contents = await file.read()
    try:
        payload = parse_students_from_file(contents, file.filename or "students")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    students = crud.upsert_students(session, payload)
    return [StudentRead.from_orm(s) for s in students]


@router.post("/submissions", response_model=list[SubmissionRead])
async def upload_submissions(
    file: UploadFile = File(...),
    course_id: int | None = None,
    student_email: str | None = None,
    session: Session = Depends(get_session),
) -> list[SubmissionRead]:
    contents = await file.read()
    try:
        submissions_payload = parse_submissions_file(
            contents,
            file.filename or "submissions",
            default_course_id=course_id,
            default_student_email=student_email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not submissions_payload:
        raise HTTPException(status_code=400, detail="No rows detected in upload")
    created: list[SubmissionRead] = []
    for record in submissions_payload:
        ai_probability = await _fetch_ai_probability(record)
        created_submission = crud.create_submission(session, record, ai_probability=ai_probability)
        created.append(SubmissionRead.from_orm(created_submission))
    return created
