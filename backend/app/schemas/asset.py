from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.schemas.common import TimestampedModel


class AssetBase(BaseModel):
    vault_id: int
    deliverable_id: int | None = None
    name: str
    asset_type: str | None = None
    dcc_software: str | None = None
    asset_metadata: dict[str, Any] | None = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    vault_id: int | None = None
    deliverable_id: int | None = None
    name: str | None = None
    asset_type: str | None = None
    dcc_software: str | None = None
    asset_metadata: dict[str, Any] | None = None
    current_version: int | None = None
    latest_file_name: str | None = None
    latest_object_key: str | None = None


class AssetRead(AssetBase, TimestampedModel):
    current_version: int
    latest_file_name: str | None = None
    latest_object_key: str | None = None
