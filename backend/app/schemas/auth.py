from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas.person import PersonRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: PersonRead
