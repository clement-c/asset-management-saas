from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.database import get_db
from app.models import Person, Project, Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskRead])
def list_tasks(db: Session = Depends(get_db)) -> list[Task]:
    return list(db.scalars(select(Task).order_by(Task.created_at.desc())).all())


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)) -> Task:
    get_or_404(db, Project, payload.project_id, "Project")
    if payload.assignee_id is not None:
        get_or_404(db, Person, payload.assignee_id, "Person")
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db)) -> Task:
    return get_or_404(db, Task, task_id, "Task")


@router.put("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)) -> Task:
    task = get_or_404(db, Task, task_id, "Task")
    if payload.project_id is not None:
        get_or_404(db, Project, payload.project_id, "Project")
    if payload.assignee_id is not None:
        get_or_404(db, Person, payload.assignee_id, "Person")
    apply_updates(task, payload)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_task(task_id: int, db: Session = Depends(get_db)) -> Response:
    task = get_or_404(db, Task, task_id, "Task")
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
