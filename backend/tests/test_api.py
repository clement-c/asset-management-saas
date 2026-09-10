from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models import Base


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_healthcheck(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_project_crud(client: TestClient) -> None:
    create_response = client.post("/api/v1/projects/", json={"name": "Demo Project", "code": "DEMO"})
    assert create_response.status_code == 201
    project = create_response.json()

    list_response = client.get("/api/v1/projects/")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    update_response = client.put(f"/api/v1/projects/{project['id']}", json={"status": "archived"})
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "archived"

    delete_response = client.delete(f"/api/v1/projects/{project['id']}")
    assert delete_response.status_code == 204
