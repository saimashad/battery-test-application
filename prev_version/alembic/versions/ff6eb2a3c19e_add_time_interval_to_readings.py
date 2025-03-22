"""add time interval to readings

Revision ID: ff6eb2a3c19e
Revises: 9d933102e954
Create Date: 2025-03-08 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ff6eb2a3c19e'
down_revision = '9d933102e954'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add time_interval column to readings table
    op.add_column('readings', sa.Column('time_interval', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove time_interval column from readings table
    op.drop_column('readings', 'time_interval')