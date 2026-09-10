from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.common import TimestampedModel


class DeliverableBase(BaseModel):
    project_id: int
    task_id: int | None = None
    name: str
    description: str | None = None
    status: str = "planned"
    due_date: date | None = None


class DeliverableCreate(DeliverableBase):
    pass


class DeliverableUpdate(BaseModel):
    project_id: int | None = None
    task_id: int | None = None
    name: str | None = None
    description: str | None = None
    status: str | None = None
    due_date: date | None = None


class DeliverableRead(DeliverableBase, TimestampedModel):
    pass
