from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models, database
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pathlib import Path

router = APIRouter(
    prefix="/test",
    tags=["tests"],
    responses={404: {"description": "Not found"}},
)

templates = Jinja2Templates(directory="app/templates")

# Helper function to format duration
def format_duration(start_time, end_time):
    if not end_time:
        return "In Progress"
    duration = end_time - start_time
    hours = duration.seconds // 3600
    minutes = (duration.seconds % 3600) // 60
    return f"{hours}h {minutes}m"

# Helper function to calculate test progress
def get_test_progress(test):
    total_phases = test.total_cycles * 2  # Each cycle has charge and discharge
    completed_phases = (test.current_cycle - 1) * 2
    if test.current_phase == "discharge":
        completed_phases += 1
    return (completed_phases / total_phases) * 100

@router.get("/", response_class=HTMLResponse)
async def read_dashboard(request: Request, db: Session = Depends(database.get_db)):
    tests = crud.get_tests(db)
    return templates.TemplateResponse(
        "dashboard.html", 
        {"request": request, "tests": tests, "get_test_progress": get_test_progress}
    )

@router.get("/create", response_class=HTMLResponse)
async def create_test_form(request: Request):
    return templates.TemplateResponse("create_test.html", {"request": request})

@router.post("/", response_model=schemas.Test)
async def create_test(test: schemas.TestCreate, db: Session = Depends(database.get_db)):
    db_test = crud.create_test(db, test)
    return db_test

@router.get("/{test_id}", response_model=schemas.Test)
def read_test(request: Request, test_id: int, db: Session = Depends(database.get_db)):
    db_test = crud.get_test(db, test_id=test_id)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Get cycles data for this test
    cycles = crud.get_cycles_for_test(db, test_id)
    
    # Return a rendered template
    return templates.TemplateResponse(
        "test_details.html",
        {
            "request": request,
            "test": db_test,
            "cycles": cycles,
            "format_duration": format_duration
        }
    )

@router.get("/{test_id}/readings", response_class=HTMLResponse)
async def take_readings_form(request: Request, test_id: int, db: Session = Depends(database.get_db)):
    test = crud.get_test(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return templates.TemplateResponse("take_readings.html", {"request": request, "test": test})

@router.get("/{test_id}/readings")
def test_readings(test_id: int, request: Request, db: Session = Depends(database.get_db)):
    # Your handler code here
    ...

@router.put("/{test_id}/status", response_model=schemas.Test)
async def update_test_status(
    test_id: int, 
    status_update: schemas.TestStatusUpdate, 
    db: Session = Depends(database.get_db)
):
    db_test = crud.update_test_status(db, test_id, status_update)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return db_test