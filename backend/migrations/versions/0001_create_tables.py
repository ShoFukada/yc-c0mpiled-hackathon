"""Create sessions and detail_images tables.

Revision ID: 0001
Revises:
Create Date: 2026-03-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column("identified_shoe", sa.String(), nullable=True),
        sa.Column("result_json", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.String(),
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
    )

    op.create_table(
        "detail_images",
        sa.Column("session_id", sa.String(), sa.ForeignKey("sessions.id"), nullable=False),
        sa.Column("point_id", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.String(),
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.PrimaryKeyConstraint("session_id", "point_id"),
    )


def downgrade() -> None:
    op.drop_table("detail_images")
    op.drop_table("sessions")
