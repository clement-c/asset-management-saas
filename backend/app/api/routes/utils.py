from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session


def get_or_404(db: Session, model, object_id: int, label: str):
    instance = db.get(model, object_id)
    if instance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    return instance


def apply_updates(instance, payload) -> None:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(instance, field, value)
