import asyncio

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import crud
from ..config import get_settings
from ..database import get_session
from ..schemas import SubmissionCreate, SubmissionRead

router = APIRouter(prefix="/submissions", tags=["submissions"])
settings = get_settings()


async def _fetch_ai_probability(payload: SubmissionCreate) -> float:
    data = {
        "answer": payload.answer_text,
        "topic": payload.topic_title or "general",
        "course_name": payload.course_name,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(f"{settings.ai_pipeline_url}/analyze", json=data)
            response.raise_for_status()
            body = response.json()
            return float(body.get("ai_probability", 0.0))
    except Exception:
        # fall back to deterministic low score when AI service is not ready
        return 0.05


def _serialize(submission) -> SubmissionRead:
    return SubmissionRead(
        id=submission.id,
        student_id=submission.student_id,
        course_id=submission.course_id,
        topic_id=submission.topic_id,
        answer_text=submission.answer_text,
        ai_probability=submission.ai_probability,
        flagged=submission.flagged,
        raw_score=submission.raw_score,
        final_score=submission.final_score,
        exam_type=submission.exam_type,
        submitted_at=submission.submitted_at,
        student_name=getattr(submission.student, "name", None),
        student_email=getattr(submission.student, "email", None),
        course_name=getattr(submission.course, "name", None),
        topic_title=getattr(submission.topic, "title", None),
        topic_category=getattr(submission.topic, "category", None),
        source_filename=submission.source_filename,
        source_path=submission.source_path,
    )


@router.get("/", response_model=list[SubmissionRead])
def list_submissions(session: Session = Depends(get_session)) -> list[SubmissionRead]:
    return [_serialize(sub) for sub in crud.list_submissions(session)]


@router.post("/import", response_model=list[SubmissionRead])
async def import_submissions(
    payload: list[SubmissionCreate],
    session: Session = Depends(get_session),
) -> list[SubmissionRead]:
    if not payload:
        raise HTTPException(status_code=400, detail="Payload is empty")
    submissions: list[SubmissionRead] = []
    for row in payload:
        ai_probability = await _fetch_ai_probability(row)
        try:
            created = crud.create_submission(session, row, ai_probability)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        submissions.append(_serialize(created))
    return submissions
