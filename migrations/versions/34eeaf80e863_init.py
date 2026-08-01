"""init tender ranking schema

Revision ID: 34eeaf80e863
Revises:
Create Date: 2026-04-19 00:11:24.171276

"""
from alembic import op
import sqlalchemy as sa


revision = "34eeaf80e863"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password", sa.String(length=512), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=False)

    op.create_table(
        "tenders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("pdf_path", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "tender_requirements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tender_id", sa.Integer(), nullable=False),
        sa.Column("requirement_name", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(["tender_id"], ["tenders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("tender_requirements", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_tender_requirements_tender_id"), ["tender_id"], unique=False)

    op.create_table(
        "proposals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("supplier_id", sa.Integer(), nullable=False),
        sa.Column("tender_id", sa.Integer(), nullable=False),
        sa.Column("pdf_path", sa.String(length=512), nullable=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["supplier_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tender_id"], ["tenders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("proposals", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_proposals_supplier_id"), ["supplier_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_proposals_tender_id"), ["tender_id"], unique=False)

    op.create_table(
        "proposal_requirements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proposal_id", sa.Integer(), nullable=False),
        sa.Column("requirement_name", sa.String(length=255), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("detected", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["proposal_id"], ["proposals.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("proposal_requirements", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_proposal_requirements_proposal_id"), ["proposal_id"], unique=False)


def downgrade():
    with op.batch_alter_table("proposal_requirements", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_proposal_requirements_proposal_id"))
    op.drop_table("proposal_requirements")

    with op.batch_alter_table("proposals", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_proposals_tender_id"))
        batch_op.drop_index(batch_op.f("ix_proposals_supplier_id"))
    op.drop_table("proposals")

    with op.batch_alter_table("tender_requirements", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_tender_requirements_tender_id"))
    op.drop_table("tender_requirements")

    op.drop_table("tenders")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_email"))
    op.drop_table("users")
