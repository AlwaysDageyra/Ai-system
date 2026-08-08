"""add missing user profile fields

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa


revision = 'e2f3a4b5c6d7'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('year_established', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('country', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('contact_person', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('business_description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('main_services', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('industry', sa.String(length=100), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('industry')
        batch_op.drop_column('main_services')
        batch_op.drop_column('business_description')
        batch_op.drop_column('contact_person')
        batch_op.drop_column('city')
        batch_op.drop_column('country')
        batch_op.drop_column('year_established')
        batch_op.drop_column('company_type')
