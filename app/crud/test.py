from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime

from app.db.models import Test, Bank, Cycle, Reading, CellValue, TestStatus
from app.schemas.test import TestCreate, BankCreate

def create_test(db: Session, test: TestCreate) -> Test:
    # Calculate start_time based on start_date
    start_time = test.start_date

    # Create test instance
    db_test = Test(
        job_number=test.job_number,
        customer_name=test.customer_name,
        start_date=test.start_date,
        start_time=start_time,
        number_of_cycles=test.number_of_cycles,
        time_interval=test.time_interval,
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
            db_cycle = Cycle(
                bank_id=db_bank.id,
                cycle_number=cycle_num,
                reading_type="discharge",  # Default to discharge
                start_time=None  # Will be set when cycle starts
            )
            db.add(db_cycle)

    db.commit()
    db.refresh(db_test)
    return db_test

def get_test(db: Session, test_id: str) -> Optional[Test]:
    return db.query(Test).filter(Test.id == test_id).first()

def get_tests(db: Session, skip: int = 0, limit: int = 100) -> List[Test]:
    return db.query(Test).offset(skip).limit(limit).all()

def update_test_status(db: Session, test_id: str, status: TestStatus) -> Optional[Test]:
    db_test = get_test(db, test_id)
    if db_test:
        db_test.status = status
        db.commit()
        db.refresh(db_test)
    return db_test

def create_reading(
    db: Session,
    cycle_id: str,
    cell_values: List[float],
    is_ocv: bool,
    reading_number: int,
    timestamp: datetime = None
) -> Reading:
    if timestamp is None:
        timestamp = datetime.utcnow()

    db_reading = Reading(
        cycle_id=cycle_id,
        reading_number=reading_number,
        timestamp=timestamp,
        is_ocv=is_ocv
    )
    db.add(db_reading)
    db.flush()

    # Create cell values
    for cell_num, value in enumerate(cell_values, start=1):
        db_cell_value = CellValue(
            reading_id=db_reading.id,
            cell_number=cell_num,
            value=value
        )
        db.add(db_cell_value)

    db.commit()
    db.refresh(db_reading)
    return db_reading

def get_cycle_readings(db: Session, cycle_id: str) -> List[Reading]:
    return db.query(Reading).filter(Reading.cycle_id == cycle_id).all()

def update_cycle_completion(
    db: Session,
    cycle_id: str,
    end_time: datetime
) -> Optional[Cycle]:
    db_cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    if db_cycle:
        db_cycle.end_time = end_time
        duration = int((end_time - db_cycle.start_time).total_seconds() / 60)
        db_cycle.duration = duration
        db.commit()
        db.refresh(db_cycle)
    return db_cycle 