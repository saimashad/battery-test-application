from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database

router = APIRouter(
    prefix="/cycles",
    tags=["cycles"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Cycle)
async def create_cycle(cycle: schemas.CycleCreate, db: Session = Depends(database.get_db)):
    return crud.create_cycle(db, cycle)

@router.get("/{cycle_id}", response_model=schemas.Cycle)
async def read_cycle(cycle_id: int, db: Session = Depends(database.get_db)):
    db_cycle = crud.get_cycle(db, cycle_id)
    if db_cycle is None:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return db_cycle

@router.put("/{cycle_id}/complete")
async def complete_cycle(cycle_id: int, db: Session = Depends(database.get_db)):
    test_completed = crud.complete_cycle(db, cycle_id)
    if test_completed is None:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return {"success": True, "test_completed": test_completed}

@router.get("/{cycle_id}/readings", response_model=List[schemas.Reading])
async def read_cycle_readings(cycle_id: int, db: Session = Depends(database.get_db)):
    readings = crud.get_readings_for_cycle(db, cycle_id)
    return readings