from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import TimestampedModel


class ProjectBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None
    status: str = "active"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    status: str | None = None


class ProjectRead(ProjectBase, TimestampedModel):
    pass
