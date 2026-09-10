from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AssetVault(TimestampMixin, Base):
    __tablename__ = "asset_vaults"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    storage_prefix: Mapped[str | None] = mapped_column(String(255), nullable=True)

    project = relationship("Project", back_populates="asset_vaults")
    assets = relationship("Asset", back_populates="vault", cascade="all, delete-orphan")
