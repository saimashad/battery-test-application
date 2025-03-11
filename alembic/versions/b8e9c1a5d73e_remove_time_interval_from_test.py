"""remove time interval from test

Revision ID: b8e9c1a5d73e
Revises: ff6eb2a3c19e
Create Date: 2025-03-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8e9c1a5d73e'
down_revision = 'ff6eb2a3c19e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove time_interval column from tests table
    op.drop_column('tests', 'time_interval')


def downgrade() -> None:
    # Add time_interval column back to tests table
    op.add_column('tests', sa.Column('time_interval', sa.Integer(), nullable=True))