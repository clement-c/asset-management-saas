from fastapi import APIRouter

from app.api.routes import asset_vaults, asset_versions, assets, auth, deliverables, health, people, projects, tasks

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(people.router)
api_router.include_router(tasks.router)
api_router.include_router(deliverables.router)
api_router.include_router(asset_vaults.router)
api_router.include_router(assets.router)
api_router.include_router(asset_versions.router)
