from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.models import Bank
from app.schemas.test import BankCreate

def get_bank(db: Session, bank_id: str) -> Optional[Bank]:
    """Get a bank by ID."""
    return db.query(Bank).filter(Bank.id == bank_id).first()

def get_banks_by_test(db: Session, test_id: str) -> List[Bank]:
    """Get all banks for a specific test."""
    return db.query(Bank).filter(Bank.test_id == test_id).all()

def create_bank(db: Session, test_id: str, bank: BankCreate) -> Bank:
    """Create a new bank for a test."""
    # Calculate discharge current
    discharge_current = (bank.percentage_capacity * bank.cell_rate) / 100
    
    # Create bank instance
    db_bank = Bank(
        test_id=test_id,
        bank_number=bank.bank_number,
        cell_type=bank.cell_type,
        cell_rate=bank.cell_rate,
        percentage_capacity=bank.percentage_capacity,
        discharge_current=discharge_current,
        number_of_cells=bank.number_of_cells
    )
    
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    
    return db_bank