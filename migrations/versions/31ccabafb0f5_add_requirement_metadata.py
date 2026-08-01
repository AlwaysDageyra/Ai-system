"""add requirement metadata

Revision ID: 31ccabafb0f5
Revises: 3e9e8c3631fa
Create Date: 2026-06-15 23:36:29.987836

"""
from alembic import op
import sqlalchemy as sa


revision = '31ccabafb0f5'
down_revision = '3e9e8c3631fa'
branch_labels = None
depends_on = None


def upgrade():
    # Recreate proposal_requirements with all new columns
    with op.batch_alter_table('proposal_requirements', recreate='always') as batch_op:
        batch_op.add_column(sa.Column('display_label', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('points_earned', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('points_possible', sa.Integer(), nullable=False, server_default='0'))

    # Recreate tender_requirements with all new columns
    with op.batch_alter_table('tender_requirements', recreate='always') as batch_op:
        batch_op.add_column(sa.Column('display_label', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('points', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='0'))


def downgrade():
    with op.batch_alter_table('tender_requirements', recreate='always') as batch_op:
        batch_op.drop_column('is_mandatory')
        batch_op.drop_column('points')
        batch_op.drop_column('display_label')

    with op.batch_alter_table('proposal_requirements', recreate='always') as batch_op:
        batch_op.drop_column('points_possible')
        batch_op.drop_column('points_earned')
        batch_op.drop_column('is_mandatory')
        batch_op.drop_column('display_label')
