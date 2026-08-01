"""add_contact_messages

Revision ID: c9d8e7f6a5b4
Revises: b8f2c9a1e3d4
Create Date: 2026-07-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'c9d8e7f6a5b4'
down_revision = 'b8f2c9a1e3d4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'contact_messages',
        sa.Column('id',         sa.Integer(),     nullable=False),
        sa.Column('name',       sa.String(255),   nullable=False),
        sa.Column('email',      sa.String(255),   nullable=False),
        sa.Column('company',    sa.String(255),   nullable=True),
        sa.Column('subject',    sa.String(255),   nullable=False),
        sa.Column('message',    sa.Text(),         nullable=False),
        sa.Column('is_read',    sa.Boolean(),      nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('contact_messages')
