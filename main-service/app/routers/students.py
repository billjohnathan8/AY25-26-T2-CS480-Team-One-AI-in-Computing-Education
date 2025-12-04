from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import crud
from ..database import get_session
from ..schemas import Message, StudentCreate, StudentRead

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/", response_model=list[StudentRead])
def list_students(session: Session = Depends(get_session)) -> list[StudentRead]:
    return [StudentRead.from_orm(student) for student in crud.list_students(session)]


@router.post("/import", response_model=list[StudentRead])
def import_students(
    payload: list[StudentCreate],
    session: Session = Depends(get_session),
) -> list[StudentRead]:
    if not payload:
        raise HTTPException(status_code=400, detail="Payload is empty")
    students = crud.upsert_students(session, payload)
    return [StudentRead.from_orm(student) for student in students]
