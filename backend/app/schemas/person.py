from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas.common import TimestampedModel


class PersonBase(BaseModel):
    project_id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str | None = None


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    project_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    role: str | None = None


class PersonRead(PersonBase, TimestampedModel):
    pass
