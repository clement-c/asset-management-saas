from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.database import get_db
from app.models import Deliverable, Project, Task
from app.schemas.deliverable import DeliverableCreate, DeliverableRead, DeliverableUpdate

router = APIRouter(prefix="/deliverables", tags=["deliverables"])


@router.get("/", response_model=list[DeliverableRead])
def list_deliverables(db: Session = Depends(get_db)) -> list[Deliverable]:
    return list(db.scalars(select(Deliverable).order_by(Deliverable.created_at.desc())).all())


@router.post("/", response_model=DeliverableRead, status_code=status.HTTP_201_CREATED)
def create_deliverable(payload: DeliverableCreate, db: Session = Depends(get_db)) -> Deliverable:
    get_or_404(db, Project, payload.project_id, "Project")
    if payload.task_id is not None:
        get_or_404(db, Task, payload.task_id, "Task")
    deliverable = Deliverable(**payload.model_dump())
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)
    return deliverable


@router.get("/{deliverable_id}", response_model=DeliverableRead)
def get_deliverable(deliverable_id: int, db: Session = Depends(get_db)) -> Deliverable:
    return get_or_404(db, Deliverable, deliverable_id, "Deliverable")


@router.put("/{deliverable_id}", response_model=DeliverableRead)
def update_deliverable(deliverable_id: int, payload: DeliverableUpdate, db: Session = Depends(get_db)) -> Deliverable:
    deliverable = get_or_404(db, Deliverable, deliverable_id, "Deliverable")
    if payload.project_id is not None:
        get_or_404(db, Project, payload.project_id, "Project")
    if payload.task_id is not None:
        get_or_404(db, Task, payload.task_id, "Task")
    apply_updates(deliverable, payload)
    db.commit()
    db.refresh(deliverable)
    return deliverable


@router.delete("/{deliverable_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_deliverable(deliverable_id: int, db: Session = Depends(get_db)) -> Response:
    deliverable = get_or_404(db, Deliverable, deliverable_id, "Deliverable")
    db.delete(deliverable)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
