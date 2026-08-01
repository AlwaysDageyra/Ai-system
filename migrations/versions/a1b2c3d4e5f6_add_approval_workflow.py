"""add approval workflow to tenders and super_admin role

Revision ID: a1b2c3d4e5f6
Revises: 7123103ee716
Create Date: 2026-06-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '7123103ee716'
branch_labels = None
depends_on = None


def upgrade():
    # Add approval workflow columns to tenders
    op.add_column('tenders', sa.Column(
        'approval_status', sa.String(20), nullable=False, server_default='approved'
    ))
    op.add_column('tenders', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('tenders', sa.Column('created_by_id', sa.Integer(), nullable=True))
    op.add_column('tenders', sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenders', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

    # Existing tenders are already live — mark them approved
    op.execute("UPDATE tenders SET approval_status = 'approved' WHERE approval_status = 'approved'")

    # FK from tenders.created_by_id → users.id (nullable so existing rows are unaffected)
    op.create_foreign_key(
        'fk_tenders_created_by_id', 'tenders', 'users',
        ['created_by_id'], ['id'], ondelete='SET NULL'
    )

    # Expand role column on users to accommodate super_admin
    op.alter_column('users', 'role',
        existing_type=sa.String(50),
        type_=sa.String(50),
        nullable=False,
        server_default='supplier'
    )


def downgrade():
    op.drop_constraint('fk_tenders_created_by_id', 'tenders', type_='foreignkey')
    op.drop_column('tenders', 'reviewed_at')
    op.drop_column('tenders', 'submitted_at')
    op.drop_column('tenders', 'created_by_id')
    op.drop_column('tenders', 'rejection_reason')
    op.drop_column('tenders', 'approval_status')
