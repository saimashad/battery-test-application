from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.schemas.test import TestCreate, Test, ReadingCreate, Reading
from app.crud import test as crud
from app.db.models import TestStatus

router = APIRouter()

@router.post("/tests", response_model=Test, status_code=status.HTTP_201_CREATED)
def create_test(test: TestCreate, db: Session = Depends(get_db)):
    """Create a new battery test."""
    return crud.create_test(db=db, test=test)

@router.get("/tests", response_model=List[Test])
def list_tests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all battery tests."""
    return crud.get_tests(db, skip=skip, limit=limit)

@router.get("/tests/{test_id}", response_model=Test)
def get_test(test_id: str, db: Session = Depends(get_db)):
    """Get a specific test by ID."""
    db_test = crud.get_test(db, test_id)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return db_test

@router.post("/cycles/{cycle_id}/readings", response_model=Reading)
def create_reading(
    cycle_id: str,
    reading: ReadingCreate,
    is_ocv: bool,
    reading_number: int,
    db: Session = Depends(get_db)
):
    """Create a new reading for a specific cycle."""
    return crud.create_reading(
        db=db,
        cycle_id=cycle_id,
        cell_values=reading.cell_values,
        is_ocv=is_ocv,
        reading_number=reading_number,
        timestamp=reading.timestamp
    )

@router.get("/cycles/{cycle_id}/readings", response_model=List[Reading])
def get_cycle_readings(cycle_id: str, db: Session = Depends(get_db)):
    """Get all readings for a specific cycle."""
    return crud.get_cycle_readings(db, cycle_id)

@router.put("/tests/{test_id}/status")
def update_test_status(test_id: str, status: TestStatus, db: Session = Depends(get_db)):
    """Update the status of a test."""
    db_test = crud.update_test_status(db, test_id, status)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return db_test

@router.put("/cycles/{cycle_id}/complete")
def complete_cycle(cycle_id: str, db: Session = Depends(get_db)):
    """Mark a cycle as complete."""
    db_cycle = crud.update_cycle_completion(db, cycle_id, datetime.utcnow())
    if db_cycle is None:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return db_cycle 