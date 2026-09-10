from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.person import Person


def init_db(db: Session | None = None) -> None:
    session = db or SessionLocal()
    should_close = db is None
    try:
        admin = session.scalar(select(Person).where(Person.email == "admin@example.com"))
        if not admin:
            admin = Person(
                first_name="System",
                last_name="Admin",
                email="admin@example.com",
                role="System Administrator",
                hashed_password=hash_password("admin123"),
                is_admin=True,
                project_id=None,
            )
            session.add(admin)
            session.commit()
    except Exception:
        session.rollback()
    finally:
        if should_close:
            session.close()
