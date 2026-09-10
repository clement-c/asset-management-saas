from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Deliverable(TimestampMixin, Base):
    __tablename__ = "deliverables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="planned")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    project = relationship("Project", back_populates="deliverables")
    task = relationship("Task", back_populates="deliverables")
    assets = relationship("Asset", back_populates="deliverable")
