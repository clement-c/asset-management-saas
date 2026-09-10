from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TimestampedModel(ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime


class DateOptionalMixin(BaseModel):
    due_date: date | None = None
