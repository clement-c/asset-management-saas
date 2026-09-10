from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.database import get_db
from app.core.security import hash_password
from app.models import Person, Project
from app.schemas.person import PersonCreate, PersonRead, PersonUpdate

router = APIRouter(prefix="/people", tags=["people"])


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


@router.get("/", response_model=list[PersonRead])
def list_people(db: Session = Depends(get_db)) -> list[PersonRead]:
    people = list(db.scalars(select(Person).order_by(Person.last_name, Person.first_name)).all())
    return [_to_person_read(p) for p in people]


@router.post("/", response_model=PersonRead, status_code=status.HTTP_201_CREATED)
def create_person(payload: PersonCreate, db: Session = Depends(get_db)) -> PersonRead:
    if payload.project_id is not None:
        get_or_404(db, Project, payload.project_id, "Project")

    data = payload.model_dump(exclude={"password"})
    hashed_pwd = hash_password(payload.password) if payload.password else None

    person = Person(**data, hashed_password=hashed_pwd)
    db.add(person)
    db.commit()
    db.refresh(person)
    return _to_person_read(person)


@router.get("/{person_id}", response_model=PersonRead)
def get_person(person_id: int, db: Session = Depends(get_db)) -> PersonRead:
    person = get_or_404(db, Person, person_id, "Person")
    return _to_person_read(person)


@router.put("/{person_id}", response_model=PersonRead)
def update_person(person_id: int, payload: PersonUpdate, db: Session = Depends(get_db)) -> PersonRead:
    person = get_or_404(db, Person, person_id, "Person")
    if payload.project_id is not None:
        get_or_404(db, Project, payload.project_id, "Project")

    data = payload.model_dump(exclude_unset=True, exclude={"password"})
    if payload.password:
        person.hashed_password = hash_password(payload.password)

    apply_updates(person, data)
    db.commit()
    db.refresh(person)
    return _to_person_read(person)


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_person(person_id: int, db: Session = Depends(get_db)) -> Response:
    person = get_or_404(db, Person, person_id, "Person")
    db.delete(person)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
