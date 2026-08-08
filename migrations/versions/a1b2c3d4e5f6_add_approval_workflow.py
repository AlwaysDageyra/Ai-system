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
    # (batch mode — SQLite can't ALTER constraints in place, needs a table rebuild)
    with op.batch_alter_table('tenders', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'approval_status', sa.String(20), nullable=False, server_default='approved'
        ))
        batch_op.add_column(sa.Column('rejection_reason', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('created_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

    # Existing tenders are already live — mark them approved
    op.execute("UPDATE tenders SET approval_status = 'approved' WHERE approval_status = 'approved'")

    # FK from tenders.created_by_id → users.id (nullable so existing rows are unaffected)
    with op.batch_alter_table('tenders', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_tenders_created_by_id', 'users',
            ['created_by_id'], ['id'], ondelete='SET NULL'
        )

    # Expand role column on users to accommodate super_admin
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('role',
            existing_type=sa.String(50),
            type_=sa.String(50),
            nullable=False,
            server_default='supplier'
        )


def downgrade():
    with op.batch_alter_table('tenders', schema=None) as batch_op:
        batch_op.drop_constraint('fk_tenders_created_by_id', type_='foreignkey')
        batch_op.drop_column('reviewed_at')
        batch_op.drop_column('submitted_at')
        batch_op.drop_column('created_by_id')
        batch_op.drop_column('rejection_reason')
        batch_op.drop_column('approval_status')
