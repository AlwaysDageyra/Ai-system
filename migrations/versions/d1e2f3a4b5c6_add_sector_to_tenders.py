"""add sector to tenders

Revision ID: d1e2f3a4b5c6
Revises: c9d8e7f6a5b4
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c9d8e7f6a5b4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tenders', sa.Column('sector', sa.String(length=50), nullable=True))


def downgrade():
    op.drop_column('tenders', 'sector')
