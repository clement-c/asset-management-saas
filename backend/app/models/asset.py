from __future__ import annotations

from typing import Any

from sqlalchemy import ForeignKey, Integer, JSON, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

json_type = JSON().with_variant(JSONB, "postgresql")


class Asset(TimestampMixin, Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vault_id: Mapped[int] = mapped_column(ForeignKey("asset_vaults.id"), nullable=False, index=True)
    deliverable_id: Mapped[int | None] = mapped_column(ForeignKey("deliverables.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dcc_software: Mapped[str | None] = mapped_column(String(100), nullable=True)
    asset_metadata: Mapped[dict[str, Any] | None] = mapped_column(json_type, nullable=True)
    current_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latest_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latest_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True)

    vault = relationship("AssetVault", back_populates="assets")
    deliverable = relationship("Deliverable", back_populates="assets")
    versions = relationship("AssetVersion", back_populates="asset", cascade="all, delete-orphan", order_by="AssetVersion.version_number.desc()")
