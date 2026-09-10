from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.database import get_db
from app.models import Person, Project
from app.schemas.person import PersonCreate, PersonRead, PersonUpdate

router = APIRouter(prefix="/people", tags=["people"])


@router.get("/", response_model=list[PersonRead])
def list_people(db: Session = Depends(get_db)) -> list[Person]:
    return list(db.scalars(select(Person).order_by(Person.last_name, Person.first_name)).all())


@router.post("/", response_model=PersonRead, status_code=status.HTTP_201_CREATED)
def create_person(payload: PersonCreate, db: Session = Depends(get_db)) -> Person:
    get_or_404(db, Project, payload.project_id, "Project")
    person = Person(**payload.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/{person_id}", response_model=PersonRead)
def get_person(person_id: int, db: Session = Depends(get_db)) -> Person:
    return get_or_404(db, Person, person_id, "Person")


@router.put("/{person_id}", response_model=PersonRead)
def update_person(person_id: int, payload: PersonUpdate, db: Session = Depends(get_db)) -> Person:
    person = get_or_404(db, Person, person_id, "Person")
    if payload.project_id is not None:
        get_or_404(db, Project, payload.project_id, "Project")
    apply_updates(person, payload)
    db.commit()
    db.refresh(person)
    return person


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_person(person_id: int, db: Session = Depends(get_db)) -> Response:
    person = get_or_404(db, Person, person_id, "Person")
    db.delete(person)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
