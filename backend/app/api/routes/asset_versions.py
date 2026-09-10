from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.config import settings
from app.core.database import get_db
from app.core.storage import storage_service
from app.models import Asset, AssetVersion
from app.schemas.asset_version import AssetVersionCreate, AssetVersionRead, AssetVersionUpdate

router = APIRouter(prefix="/asset-versions", tags=["asset-versions"])


@router.get("/", response_model=list[AssetVersionRead])
def list_asset_versions(db: Session = Depends(get_db)) -> list[AssetVersion]:
    return list(db.scalars(select(AssetVersion).order_by(AssetVersion.created_at.desc())).all())


@router.post("/", response_model=AssetVersionRead, status_code=status.HTTP_201_CREATED)
def create_asset_version(payload: AssetVersionCreate, db: Session = Depends(get_db)) -> AssetVersion:
    asset = get_or_404(db, Asset, payload.asset_id, "Asset")
    asset_version = AssetVersion(**payload.model_dump())
    asset.current_version = max(asset.current_version, payload.version_number)
    asset.latest_file_name = payload.file_name
    asset.latest_object_key = payload.object_key
    db.add(asset_version)
    db.add(asset)
    db.commit()
    db.refresh(asset_version)
    return asset_version


@router.get("/{asset_version_id}", response_model=AssetVersionRead)
def get_asset_version(asset_version_id: int, db: Session = Depends(get_db)) -> AssetVersion:
    return get_or_404(db, AssetVersion, asset_version_id, "Asset version")


@router.get("/{asset_version_id}/download")
def download_asset_version(asset_version_id: int, db: Session = Depends(get_db)) -> StreamingResponse:
    asset_version = get_or_404(db, AssetVersion, asset_version_id, "Asset version")
    s3_object = storage_service.get_object(settings.s3_bucket_name, asset_version.object_key)
    headers = {"Content-Disposition": f'attachment; filename="{asset_version.file_name}"'}
    return StreamingResponse(
        s3_object["Body"].iter_chunks(),
        media_type=asset_version.content_type or "application/octet-stream",
        headers=headers,
    )


@router.put("/{asset_version_id}", response_model=AssetVersionRead)
def update_asset_version(asset_version_id: int, payload: AssetVersionUpdate, db: Session = Depends(get_db)) -> AssetVersion:
    asset_version = get_or_404(db, AssetVersion, asset_version_id, "Asset version")
    apply_updates(asset_version, payload)
    db.commit()
    db.refresh(asset_version)
    return asset_version


@router.delete("/{asset_version_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_asset_version(asset_version_id: int, db: Session = Depends(get_db)) -> Response:
    asset_version = get_or_404(db, AssetVersion, asset_version_id, "Asset version")
    db.delete(asset_version)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
