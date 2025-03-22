from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime

from app.db.models import Test, Bank, Cycle, Reading, CellValue, TestStatus, CellType
from app.schemas.test import TestCreate, BankCreate

def create_test(db: Session, test: TestCreate) -> Test:
    """Create a new test with banks."""
    # Calculate start_time based on start_date if not provided
    start_time = test.start_date
    
    # Create test instance
    db_test = Test(
        job_number=test.job_number,
        customer_name=test.customer_name,
        start_date=test.start_date,
        start_time=start_time,
        number_of_cycles=test.number_of_cycles,
        status=TestStatus.SCHEDULED
    )
    
    db.add(db_test)
    db.flush()  # Flush to get the test ID
    
    # Create banks
    for bank_data in test.banks:
        discharge_current = (bank_data.percentage_capacity * bank_data.cell_rate) / 100
        db_bank = Bank(
            test_id=db_test.id,
            bank_number=bank_data.bank_number,
            cell_type=bank_data.cell_type,
            cell_rate=bank_data.cell_rate,
            percentage_capacity=bank_data.percentage_capacity,
            discharge_current=discharge_current,
            number_of_cells=bank_data.number_of_cells
        )
        db.add(db_bank)
        db.flush()
        
        # Create cycles for the bank
        for cycle_num in range(1, test.number_of_cycles + 1):
            # Create charge cycle
            db_charge_cycle = Cycle(
                bank_id=db_bank.id,
                cycle_number=cycle_num,
                reading_type="charge",
                start_time=None  # Will be set when cycle starts
            )
            db.add(db_charge_cycle)
            
            # Create discharge cycle
            db_discharge_cycle = Cycle(
                bank_id=db_bank.id,
                cycle_number=cycle_num,
                reading_type="discharge",
                start_time=None  # Will be set when cycle starts
            )
            db.add(db_discharge_cycle)
    
    db.commit()
    db.refresh(db_test)
    return db_test

def get_test(db: Session, test_id: str) -> Optional[Test]:
    """Get a test by ID."""
    return db.query(Test).filter(Test.id == test_id).first()

def get_test_by_job_number(db: Session, job_number: str) -> Optional[Test]:
    """Get a test by job number."""
    return db.query(Test).filter(Test.job_number == job_number).first()

def get_tests(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Test]:
    """Get all tests with optional status filter."""
    query = db.query(Test)
    
    if status:
        query = query.filter(Test.status == status)
    
    return query.order_by(Test.created_at.desc()).offset(skip).limit(limit).all()

def update_test_status(db: Session, test_id: str, status: TestStatus) -> Optional[Test]:
    """Update the status of a test."""
    db_test = get_test(db, test_id)
    if db_test:
        db_test.status = status
        db.commit()
        db.refresh(db_test)
    return db_test

def delete_test(db: Session, test_id: str) -> bool:
    """
    Delete a test and all associated data (banks, cycles, readings, cell values).
    Returns True if successful, False if test not found.
    """
    db_test = get_test(db, test_id)
    if not db_test:
        return False
    
    # SQLAlchemy cascade will handle deleting related entities
    db.delete(db_test)
    db.commit()
    return True

def check_test_completion(db: Session, test_id: str) -> bool:
    """
    Check if all cycles and readings for a test are complete.
    If so, update the test status to completed.
    """
    db_test = get_test(db, test_id)
    if not db_test:
        return False
    
    # If test is already completed, no need to check
    if db_test.status == TestStatus.COMPLETED:
        return True
    
    # Set test to in_progress if it's currently scheduled
    if db_test.status == TestStatus.SCHEDULED:
        db_test.status = TestStatus.IN_PROGRESS
        db.commit()
    
    # Get all banks for this test
    banks = db.query(Bank).filter(Bank.test_id == test_id).all()
    
    # For each bank, check if all cycles are complete
    all_cycles_complete = True
    for bank in banks:
        cycles = db.query(Cycle).filter(Cycle.bank_id == bank.id).all()
        
        # Check if all cycles have end_time set
        for cycle in cycles:
            if cycle.end_time is None:
                all_cycles_complete = False
                break
        
        if not all_cycles_complete:
            break
    
    # If all cycles are complete, update test status
    if all_cycles_complete:
        db_test.status = TestStatus.COMPLETED
        db.commit()
        db.refresh(db_test)
        return True
    
    return False

def create_reading(
    db: Session,
    cycle_id: str,
    cell_values: List[float],
    is_ocv: bool,
    reading_number: int,
    timestamp: datetime = None,
    time_interval: Optional[int] = None
) -> Reading:
    """Create a new reading with cell values."""
    if timestamp is None:
        timestamp = datetime.utcnow()
    
    # Get cycle
    cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    if not cycle:
        raise ValueError(f"Cycle with ID {cycle_id} not found")
    
    # If this is the first reading for the cycle, set the start time
    if cycle.start_time is None:
        cycle.start_time = timestamp
    
    # Create reading
    db_reading = Reading(
        cycle_id=cycle_id,
        reading_number=reading_number,
        timestamp=timestamp,
        is_ocv=is_ocv,
        time_interval=time_interval if not is_ocv else None  # Only set time_interval for CCV readings
    )
    
    db.add(db_reading)
    db.flush()
    
    # Create cell values
    for i, value in enumerate(cell_values):
        cell_number = i + 1
        db_cell_value = CellValue(
            reading_id=db_reading.id,
            cell_number=cell_number,
            value=value
        )
        db.add(db_cell_value)
    
    db.commit()
    db.refresh(db_reading)
    
    # Check if this is the last reading and update test status if needed
    if not is_ocv:  # Only check for CCV readings
        check_test_completion(db, cycle.bank.test_id)
    
    return db_reading

def get_cycle_readings(db: Session, cycle_id: str) -> List[Reading]:
    """Get all readings for a specific cycle."""
    return db.query(Reading).filter(Reading.cycle_id == cycle_id).order_by(Reading.reading_number).all()

def get_next_unfinished_cycle(db: Session, test_id: str) -> Optional[Cycle]:
    """
    Get the next unfinished cycle for a test.
    Returns None if all cycles are finished.
    """
    # Get all banks for the test
    banks = db.query(Bank).filter(Bank.test_id == test_id).all()
    
    # For each bank, find the first unfinished cycle
    for bank in banks:
        # Get all cycles for this bank, ordered by cycle_number and reading_type
        # (charge comes before discharge)
        cycles = db.query(Cycle).filter(
            Cycle.bank_id == bank.id
        ).order_by(
            Cycle.cycle_number,
            Cycle.reading_type
        ).all()
        
        # Find the first cycle that doesn't have an end_time
        for cycle in cycles:
            if cycle.end_time is None:
                return cycle
    
    # All cycles are finished
    return None

def update_cycle_completion(
    db: Session,
    cycle_id: str,
    end_time: datetime
) -> Optional[Cycle]:
    """Mark a cycle as complete and calculate duration."""
    db_cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    
    if db_cycle:
        db_cycle.end_time = end_time
        
        # Calculate duration in minutes
        if db_cycle.start_time:
            duration = int((end_time - db_cycle.start_time).total_seconds() / 60)
            db_cycle.duration = duration
        
        db.commit()
        db.refresh(db_cycle)
        
        # Check if test is complete
        test_id = db_cycle.bank.test_id
        check_test_completion(db, test_id)
    
    return db_cycle