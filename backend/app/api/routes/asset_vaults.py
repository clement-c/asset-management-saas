from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.utils import apply_updates, get_or_404
from app.core.database import get_db
from app.models import AssetVault, Project
from app.schemas.asset_vault import AssetVaultCreate, AssetVaultRead, AssetVaultUpdate

router = APIRouter(prefix="/asset-vaults", tags=["asset-vaults"])


@router.get("/", response_model=list[AssetVaultRead])
def list_asset_vaults(db: Session = Depends(get_db)) -> list[AssetVault]:
    return list(db.scalars(select(AssetVault).order_by(AssetVault.name)).all())


@router.post("/", response_model=AssetVaultRead, status_code=status.HTTP_201_CREATED)
def create_asset_vault(payload: AssetVaultCreate, db: Session = Depends(get_db)) -> AssetVault:
    get_or_404(db, Project, payload.project_id, "Project")
    asset_vault = AssetVault(**payload.model_dump())
    db.add(asset_vault)
    db.commit()
    db.refresh(asset_vault)
    return asset_vault


@router.get("/{asset_vault_id}", response_model=AssetVaultRead)
def get_asset_vault(asset_vault_id: int, db: Session = Depends(get_db)) -> AssetVault:
    return get_or_404(db, AssetVault, asset_vault_id, "Asset vault")


@router.put("/{asset_vault_id}", response_model=AssetVaultRead)
def update_asset_vault(asset_vault_id: int, payload: AssetVaultUpdate, db: Session = Depends(get_db)) -> AssetVault:
    asset_vault = get_or_404(db, AssetVault, asset_vault_id, "Asset vault")
    if payload.project_id is not None:
        get_or_404(db, Project, payload.project_id, "Project")
    apply_updates(asset_vault, payload)
    db.commit()
    db.refresh(asset_vault)
    return asset_vault


@router.delete("/{asset_vault_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_asset_vault(asset_vault_id: int, db: Session = Depends(get_db)) -> Response:
    asset_vault = get_or_404(db, AssetVault, asset_vault_id, "Asset vault")
    db.delete(asset_vault)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
