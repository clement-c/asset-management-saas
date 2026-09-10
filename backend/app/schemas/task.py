from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.common import TimestampedModel


class TaskBase(BaseModel):
    project_id: int
    assignee_id: int | None = None
    title: str
    description: str | None = None
    status: str = "todo"
    due_date: date | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    project_id: int | None = None
    assignee_id: int | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    due_date: date | None = None


class TaskRead(TaskBase, TimestampedModel):
    pass
