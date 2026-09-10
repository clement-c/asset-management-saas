from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas.common import TimestampedModel


class PersonBase(BaseModel):
    project_id: int | None = None
    first_name: str
    last_name: str
    email: EmailStr
    role: str | None = None
    is_admin: bool = False


class PersonCreate(PersonBase):
    password: str | None = None


class PersonUpdate(BaseModel):
    project_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    password: str | None = None
    is_admin: bool | None = None


class PersonRead(PersonBase, TimestampedModel):
    id: int
    has_password: bool = False
