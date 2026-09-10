from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_token, decode_token, verify_password
from app.models import Person
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.person import PersonRead

router = APIRouter(prefix="/auth", tags=["auth"])
security_scheme = HTTPBearer(auto_error=False)


def _to_person_read(person: Person) -> PersonRead:
    return PersonRead(
        id=person.id,
        project_id=person.project_id,
        first_name=person.first_name,
        last_name=person.last_name,
        email=person.email,
        role=person.role,
        is_admin=person.is_admin,
        created_at=person.created_at,
        updated_at=person.updated_at,
        has_password=bool(person.hashed_password),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Person:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    person = db.get(Person, payload.get("sub"))
    if not person:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return person


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    person = db.scalar(select(Person).where(Person.email == payload.email))
    if not person or not verify_password(payload.password, person.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_token(person.id, person.email)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=_to_person_read(person),
    )


@router.get("/me", response_model=PersonRead)
def get_me(current_user: Person = Depends(get_current_user)) -> PersonRead:
    return _to_person_read(current_user)
