from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import crud
from ..database import get_session
from ..schemas import AuthResponse, Message, UserCreate, UserLogin
from ..sessions import session_store

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: UserCreate, session: Session = Depends(get_session)) -> AuthResponse:
    try:
        user = crud.create_user(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    token = session_store.create(user.id)
    return AuthResponse(token=token, user_id=user.id)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, session: Session = Depends(get_session)) -> AuthResponse:
    user = crud.authenticate_user(session, payload)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = session_store.create(user.id)
    return AuthResponse(token=token, user_id=user.id)
