"""add auth fields to people table

Revision ID: 0002_add_auth_fields
Revises: 0001_initial
Create Date: 2026-09-10

"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_auth_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("people", sa.Column("hashed_password", sa.String(length=255), nullable=True))
    op.add_column("people", sa.Column("is_admin", sa.Boolean(), server_default="false", nullable=False))
    op.alter_column("people", "project_id", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column("people", "project_id", existing_type=sa.Integer(), nullable=False)
    op.drop_column("people", "is_admin")
    op.drop_column("people", "hashed_password")
