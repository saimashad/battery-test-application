from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.models import Reading, CellValue, Cycle
from app.schemas.test import ReadingCreate

def get_reading(db: Session, reading_id: str) -> Optional[Reading]:
    """Get a reading by ID."""
    return db.query(Reading).filter(Reading.id == reading_id).first()

def get_readings_by_cycle(db: Session, cycle_id: str) -> List[Reading]:
    """Get all readings for a specific cycle."""
    return db.query(Reading).filter(Reading.cycle_id == cycle_id).order_by(Reading.reading_number).all()

def create_reading(db: Session, cycle_id: str, reading: ReadingCreate) -> Reading:
    """Create a new reading with cell values."""
    # Get cycle
    cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    if not cycle:
        raise ValueError(f"Cycle with ID {cycle_id} not found")
    
    # If this is the first reading for the cycle and cycle hasn't started,
    # set the start time
    if cycle.start_time is None:
        cycle.start_time = datetime.utcnow()
    
    # Create reading
    db_reading = Reading(
        cycle_id=cycle_id,
        reading_number=reading.reading_number,
        timestamp=reading.timestamp or datetime.utcnow(),
        is_ocv=reading.is_ocv,
        time_interval=reading.time_interval if not reading.is_ocv else None  # Only set time_interval for CCV readings
    )
    
    db.add(db_reading)
    db.flush()  # Get ID without committing
    
    # Create cell values
    for i, value in enumerate(reading.cell_values):
        cell_number = i + 1
        db_cell_value = CellValue(
            reading_id=db_reading.id,
            cell_number=cell_number,
            value=value
        )
        db.add(db_cell_value)
    
    db.commit()
    db.refresh(db_reading)
    
    # Check if this is the last reading and all cycles are complete
    from app.crud.test import check_test_completion
    check_test_completion(db, cycle.bank.test_id)
    
    return db_reading

def get_latest_reading(db: Session, cycle_id: str, is_ocv: bool = None) -> Optional[Reading]:
    """Get the latest reading for a cycle, optionally filtered by OCV/CCV."""
    query = db.query(Reading).filter(Reading.cycle_id == cycle_id)
    
    if is_ocv is not None:
        query = query.filter(Reading.is_ocv == is_ocv)
    
    return query.order_by(Reading.reading_number.desc()).first()