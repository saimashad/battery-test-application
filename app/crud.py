from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime
from typing import List, Optional

# Battery Bank operations
def create_bank(db: Session, bank: schemas.BankCreate):
    db_bank = models.BatteryBank(
        name=bank.name,
        description=bank.description,
        num_cells=bank.num_cells
    )
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    return db_bank

def get_bank(db: Session, bank_id: int):
    return db.query(models.BatteryBank).filter(models.BatteryBank.id == bank_id).first()

# Test Session operations
def create_test(db: Session, test: schemas.TestCreate):
    # First create the bank if it doesn't exist
    db_bank = create_bank(db, test.bank)
    
    db_test = models.TestSession(
        bank_id=db_bank.id,
        total_cycles=test.total_cycles,
        current_cycle=1,
        current_phase="charge",
        status="scheduled"
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test

def get_test(db: Session, test_id: int):
    return db.query(models.TestSession).filter(models.TestSession.id == test_id).first()

def get_tests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TestSession).offset(skip).limit(limit).all()

def update_test_status(db: Session, test_id: int, status_update: schemas.TestStatusUpdate):
    db_test = get_test(db, test_id)
    if db_test:
        db_test.status = status_update.status
        db.commit()
        db.refresh(db_test)
    return db_test

# Reading Cycle operations
def create_cycle(db: Session, cycle: schemas.CycleCreate):
    db_cycle = models.ReadingCycle(
        test_id=cycle.test_id,
        cycle_number=cycle.cycle_number,
        phase=cycle.phase,
        ccv_interval=cycle.ccv_interval,
        status="active"
    )
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

def get_cycle(db: Session, cycle_id: int):
    return db.query(models.ReadingCycle).filter(models.ReadingCycle.id == cycle_id).first()

def get_cycles_for_test(db: Session, test_id: int):
    return db.query(models.ReadingCycle).filter(models.ReadingCycle.test_id == test_id).all()

def get_active_cycle(db: Session, test_id: int, cycle_number: int, phase: str):
    return db.query(models.ReadingCycle).filter(
        models.ReadingCycle.test_id == test_id,
        models.ReadingCycle.cycle_number == cycle_number,
        models.ReadingCycle.phase == phase,
        models.ReadingCycle.status == "active"
    ).first()

def complete_cycle(db: Session, cycle_id: int):
    db_cycle = get_cycle(db, cycle_id)
    if db_cycle:
        db_cycle.status = "completed"
        db_cycle.end_time = datetime.utcnow()
        db.commit()
        db.refresh(db_cycle)

        # Update test phase or cycle
        db_test = get_test(db, db_cycle.test_id)
        if db_cycle.phase == "charge":
            db_test.current_phase = "discharge"
        else:
            db_test.current_phase = "charge"
            db_test.current_cycle += 1

        # Check if test is completed
        if db_test.current_cycle > db_test.total_cycles:
            db_test.status = "completed"
        else:
            db_test.status = "in_progress"
            
        db.commit()
        db.refresh(db_test)
        return db_test.status == "completed"
    return False

# Reading operations
def create_ocv_readings(db: Session, test_id: int, readings: List[float]):
    test = get_test(db, test_id)
    if not test:
        return None
    
    # Create a new cycle for OCV readings
    cycle = create_cycle(db, schemas.CycleCreate(
        test_id=test_id,
        cycle_number=test.current_cycle,
        phase=test.current_phase
    ))
    
    # Create readings for each cell
    for cell_num, value in enumerate(readings, 1):
        db_reading = models.Reading(
            cycle_id=cycle.id,
            reading_type="OCV",
            cell_number=cell_num,
            value=float(value),
            phase=test.current_phase
        )
        db.add(db_reading)
    
    # Update test status if needed
    if test.status == "scheduled":
        test.status = "in_progress"
        db.commit()
    
    db.commit()
    return cycle

def create_ccv_readings(db: Session, test_id: int, readings: List[float]):
    test = get_test(db, test_id)
    if not test:
        return None
    
    # Get the active cycle
    cycle = get_active_cycle(db, test_id, test.current_cycle, test.current_phase)
    if not cycle:
        return None
    
    # Calculate sequence number for this CCV reading
    existing_ccv = [r for r in cycle.readings if r.reading_type == "CCV"]
    sequence = len(existing_ccv) // test.bank.num_cells + 1 if existing_ccv else 1
    
    # Create readings for each cell
    for cell_num, value in enumerate(readings, 1):
        db_reading = models.Reading(
            cycle_id=cycle.id,
            reading_type="CCV",
            cell_number=cell_num,
            value=float(value),
            sequence_number=sequence,
            phase=test.current_phase
        )
        db.add(db_reading)
    
    db.commit()
    return cycle

def get_readings_for_cycle(db: Session, cycle_id: int):
    return db.query(models.Reading).filter(models.Reading.cycle_id == cycle_id).all()

#Delete functionality addition

def delete_test(db: Session, test_id: int):
    """Delete a test and all associated data."""
    # Find the test
    db_test = get_test(db, test_id)
    if not db_test:
        return False
    
    # Find all cycles associated with the test
    cycles = get_cycles_for_test(db, test_id)
    
    # For each cycle, delete its readings
    for cycle in cycles:
        # Delete readings for this cycle
        db.query(models.Reading).filter(models.Reading.cycle_id == cycle.id).delete()
    
    # Delete all cycles for this test
    db.query(models.ReadingCycle).filter(models.ReadingCycle.test_id == test_id).delete()
    
    # Delete the test itself
    db.delete(db_test)
    db.commit()
    
    return True