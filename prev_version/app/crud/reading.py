# app/crud/reading.py - Enhanced reading functionality

from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.db.models import Reading, CellValue, Cycle, TestStatus
from app.schemas.test import ReadingCreate

def get_reading(db: Session, reading_id: str) -> Optional[Reading]:
    """Get a reading by ID with cell values."""
    return db.query(Reading).options(
        joinedload(Reading.cell_values)
    ).filter(Reading.id == reading_id).first()

def get_readings_by_cycle(db: Session, cycle_id: str) -> List[Reading]:
    """Get all readings for a specific cycle including cell values."""
    return db.query(Reading).options(
        joinedload(Reading.cell_values)
    ).filter(Reading.cycle_id == cycle_id).order_by(Reading.reading_number).all()

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
        db.flush()
    
    # Create reading
    timestamp = reading.timestamp or datetime.utcnow()
    db_reading = Reading(
        cycle_id=cycle_id,
        reading_number=reading.reading_number,
        timestamp=timestamp,
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
            value=float(value)  # Ensure value is stored as float
        )
        db.add(db_cell_value)
    
    # Update test status (scheduled -> in_progress)
    bank = cycle.bank
    test = bank.test
    if test.status == TestStatus.SCHEDULED:
        test.status = TestStatus.IN_PROGRESS
        db.flush()
    
    db.commit()
    db.refresh(db_reading)
    
    # Ensure relationship is loaded
    db.refresh(db_reading, ['cell_values'])
    
    return db_reading

def get_latest_reading(db: Session, cycle_id: str, is_ocv: bool = None) -> Optional[Reading]:
    """Get the latest reading for a cycle, optionally filtered by OCV/CCV."""
    query = db.query(Reading).filter(Reading.cycle_id == cycle_id)
    
    if is_ocv is not None:
        query = query.filter(Reading.is_ocv == is_ocv)
    
    return query.order_by(Reading.reading_number.desc()).first()

def has_reading_for_cycle(db: Session, cycle_id: str, is_ocv: bool = None) -> bool:
    """Check if a cycle has any readings, optionally filtered by OCV/CCV."""
    query = db.query(Reading).filter(Reading.cycle_id == cycle_id)
    
    if is_ocv is not None:
        query = query.filter(Reading.is_ocv == is_ocv)
    
    return db.query(query.exists()).scalar()