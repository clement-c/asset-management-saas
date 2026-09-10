from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import TimestampedModel


class AssetVaultBase(BaseModel):
    project_id: int
    name: str
    description: str | None = None
    storage_prefix: str | None = None


class AssetVaultCreate(AssetVaultBase):
    pass


class AssetVaultUpdate(BaseModel):
    project_id: int | None = None
    name: str | None = None
    description: str | None = None
    storage_prefix: str | None = None


class AssetVaultRead(AssetVaultBase, TimestampedModel):
    pass
