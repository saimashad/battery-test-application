from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database
import datetime

router = APIRouter(
    prefix="/api",
    tags=["readings"],
    responses={404: {"description": "Not found"}},
)

@router.post("/tests/{test_id}/ocv", status_code=201)
async def submit_ocv_readings(
    test_id: int, 
    readings_data: schemas.BulkReadingsCreate, 
    db: Session = Depends(database.get_db)
):
    cycle = crud.create_ocv_readings(db, test_id, readings_data.readings)
    if cycle is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return {"success": True}

@router.post("/tests/{test_id}/ccv", status_code=201)
async def submit_ccv_readings(
    test_id: int, 
    readings_data: schemas.BulkReadingsCreate, 
    db: Session = Depends(database.get_db)
):
    cycle = crud.create_ccv_readings(db, test_id, readings_data.readings)
    if cycle is None:
        raise HTTPException(status_code=404, detail="Test or active cycle not found")
    return {"success": True}

@router.post("/tests/{test_id}/end-phase")
async def end_phase(test_id: int, db: Session = Depends(database.get_db)):
    test = crud.get_test(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    
    current_cycle = crud.get_active_cycle(db, test_id, test.current_cycle, test.current_phase)
    if current_cycle is None:
        raise HTTPException(status_code=404, detail="Active cycle not found")
    
    test_completed = crud.complete_cycle(db, current_cycle.id)
    return {"success": True, "test_completed": test_completed}