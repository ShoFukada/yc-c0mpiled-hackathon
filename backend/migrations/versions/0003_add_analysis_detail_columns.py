"""Add detail analysis columns to point_analyses.

Replace 'report' with observation, comparison, confidence, reasoning.

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("point_analyses") as batch_op:
        batch_op.add_column(
            sa.Column("observation", sa.Text(), nullable=False, server_default=""),
        )
        batch_op.add_column(
            sa.Column("comparison", sa.Text(), nullable=False, server_default=""),
        )
        batch_op.add_column(
            sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        )
        batch_op.add_column(
            sa.Column("reasoning", sa.Text(), nullable=False, server_default=""),
        )
        batch_op.drop_column("report")


def downgrade() -> None:
    with op.batch_alter_table("point_analyses") as batch_op:
        batch_op.add_column(
            sa.Column("report", sa.Text(), nullable=False, server_default=""),
        )
        batch_op.drop_column("reasoning")
        batch_op.drop_column("confidence")
        batch_op.drop_column("comparison")
        batch_op.drop_column("observation")
