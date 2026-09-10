from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import TimestampedModel


class AssetVersionBase(BaseModel):
    asset_id: int
    version_number: int
    file_name: str
    object_key: str
    content_type: str | None = None
    file_size: int
    notes: str | None = None


class AssetVersionCreate(AssetVersionBase):
    pass


class AssetVersionUpdate(BaseModel):
    file_name: str | None = None
    content_type: str | None = None
    file_size: int | None = None
    notes: str | None = None


class AssetVersionRead(AssetVersionBase, TimestampedModel):
    pass
