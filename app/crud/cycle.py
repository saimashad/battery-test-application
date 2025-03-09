from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.models import Cycle
from app.schemas.test import CycleCreate

def get_cycle(db: Session, cycle_id: str) -> Optional[Cycle]:
    """Get a cycle by ID."""
    return db.query(Cycle).filter(Cycle.id == cycle_id).first()

def get_cycles_by_bank(db: Session, bank_id: str) -> List[Cycle]:
    """Get all cycles for a specific bank."""
    return db.query(Cycle).filter(Cycle.bank_id == bank_id).order_by(Cycle.cycle_number).all()

def create_cycle(db: Session, bank_id: str, cycle: CycleCreate) -> Cycle:
    """Create a new cycle for a bank."""
    db_cycle = Cycle(
        bank_id=bank_id,
        cycle_number=cycle.cycle_number,
        reading_type=cycle.reading_type,
        start_time=cycle.start_time or datetime.utcnow()
    )
    
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    
    return db_cycle

def complete_cycle(db: Session, cycle_id: str, end_time: datetime) -> Optional[Cycle]:
    """Mark a cycle as complete and calculate duration."""
    db_cycle = get_cycle(db, cycle_id)
    
    if db_cycle is None:
        return None
    
    # Set end time
    db_cycle.end_time = end_time
    
    # Calculate duration in minutes
    start_time = db_cycle.start_time or datetime.utcnow()
    duration_minutes = int((end_time - start_time).total_seconds() / 60)
    db_cycle.duration = duration_minutes
    
    db.commit()
    db.refresh(db_cycle)
    
    # Check if this is the last cycle for the test and update test status if needed
    from app.crud.test import check_test_completion
    check_test_completion(db, db_cycle.bank.test_id)
    
    return db_cycle