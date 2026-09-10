from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.database import get_db
from app.core.storage import storage_service
from app.models import Asset, AssetVault, AssetVersion, Deliverable
from app.schemas.asset import AssetCreate, AssetRead, AssetUpdate
from app.schemas.asset_version import AssetVersionRead

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/", response_model=list[AssetRead])
def list_assets(db: Session = Depends(get_db)) -> list[Asset]:
    return list(db.scalars(select(Asset).order_by(Asset.name)).all())


@router.post("/", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)) -> Asset:
    get_or_404(db, AssetVault, payload.vault_id, "Asset vault")
    if payload.deliverable_id is not None:
        get_or_404(db, Deliverable, payload.deliverable_id, "Deliverable")
    asset = Asset(**payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{asset_id}", response_model=AssetRead)
def get_asset(asset_id: int, db: Session = Depends(get_db)) -> Asset:
    return get_or_404(db, Asset, asset_id, "Asset")


@router.put("/{asset_id}", response_model=AssetRead)
def update_asset(asset_id: int, payload: AssetUpdate, db: Session = Depends(get_db)) -> Asset:
    asset = get_or_404(db, Asset, asset_id, "Asset")
    if payload.vault_id is not None:
        get_or_404(db, AssetVault, payload.vault_id, "Asset vault")
    if payload.deliverable_id is not None:
        get_or_404(db, Deliverable, payload.deliverable_id, "Deliverable")
    apply_updates(asset, payload)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_asset(asset_id: int, db: Session = Depends(get_db)) -> Response:
    asset = get_or_404(db, Asset, asset_id, "Asset")
    db.delete(asset)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{asset_id}/versions", response_model=list[AssetVersionRead])
def list_asset_versions(asset_id: int, db: Session = Depends(get_db)) -> list[AssetVersion]:
    get_or_404(db, Asset, asset_id, "Asset")
    return list(db.scalars(select(AssetVersion).where(AssetVersion.asset_id == asset_id).order_by(AssetVersion.version_number.desc())).all())


@router.post("/{asset_id}/upload", response_model=AssetVersionRead, status_code=status.HTTP_201_CREATED)
async def upload_asset_version(
    asset_id: int,
    file: UploadFile = File(...),
    notes: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> AssetVersion:
    asset = get_or_404(db, Asset, asset_id, "Asset")
    payload = await file.read()
    safe_name = Path(file.filename or "upload.bin").name
    next_version = asset.current_version + 1
    object_key = f"asset-{asset.id}/v{next_version}/{safe_name}"

    storage_service.upload_bytes(settings.s3_bucket_name, object_key, payload, file.content_type)

    asset_version = AssetVersion(
        asset_id=asset.id,
        version_number=next_version,
        file_name=safe_name,
        object_key=object_key,
        content_type=file.content_type,
        file_size=len(payload),
        notes=notes,
    )
    asset.current_version = next_version
    asset.latest_file_name = safe_name
    asset.latest_object_key = object_key

    db.add(asset_version)
    db.add(asset)
    db.commit()
    db.refresh(asset_version)
    return asset_version

