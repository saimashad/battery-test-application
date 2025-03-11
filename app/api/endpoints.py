from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.schemas.test import (
    TestCreate, Test, TestStatusUpdate, TestDelete,
    BankCreate, Bank, 
    CycleCreate, Cycle, CycleComplete,
    ReadingCreate, Reading
)
from app.crud import test as test_crud, bank as bank_crud, cycle as cycle_crud, reading as reading_crud
from app.db.models import TestStatus

router = APIRouter()

# Test Management Endpoints
@router.post("/tests", response_model=Test, status_code=status.HTTP_201_CREATED)
def create_test(test: TestCreate, db: Session = Depends(get_db)):
    """Create a new battery test with banks."""
    return test_crud.create_test(db=db, test=test)

@router.get("/tests", response_model=List[Test])
def list_tests(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all battery tests with optional status filter."""
    return test_crud.get_tests(db, skip=skip, limit=limit, status=status)

@router.get("/tests/{test_id}", response_model=Test)
def get_test(test_id: str, db: Session = Depends(get_db)):
    """Get a specific test by ID."""
    db_test = test_crud.get_test(db, test_id)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return db_test

@router.delete("/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(test_id: str, db: Session = Depends(get_db)):
    """Delete a test and all its associated data."""
    success = test_crud.delete_test(db, test_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test not found")
    return {}

@router.put("/tests/{test_id}/status", response_model=Test)
def update_test_status(test_id: str, status_update: TestStatusUpdate, db: Session = Depends(get_db)):
    """Update the status of a test."""
    db_test = test_crud.update_test_status(db, test_id, status_update.status)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return db_test

@router.get("/tests/{test_id}/next-cycle", response_model=Cycle)
def get_next_unfinished_cycle(test_id: str, db: Session = Depends(get_db)):
    """Get the next unfinished cycle for a test."""
    next_cycle = test_crud.get_next_unfinished_cycle(db, test_id)
    if next_cycle is None:
        raise HTTPException(status_code=404, detail="No unfinished cycles found or test not found")
    return next_cycle

@router.get("/banks/{bank_id}", response_model=Bank)
def get_bank(bank_id: str, db: Session = Depends(get_db)):
    """Get bank details by ID."""
    db_bank = bank_crud.get_bank(db, bank_id)
    if db_bank is None:
        raise HTTPException(status_code=404, detail="Bank not found")
    return db_bank

@router.get("/tests/{test_id}/banks", response_model=List[Bank])
def get_test_banks(test_id: str, db: Session = Depends(get_db)):
    """Get all banks for a specific test."""
    return bank_crud.get_banks_by_test(db, test_id)

# Cycle Management Endpoints
@router.post("/banks/{bank_id}/cycles", response_model=Cycle, status_code=status.HTTP_201_CREATED)
def create_cycle(bank_id: str, cycle: CycleCreate, db: Session = Depends(get_db)):
    """Create a new cycle for a bank."""
    return cycle_crud.create_cycle(db, bank_id, cycle)

@router.get("/banks/{bank_id}/cycles", response_model=List[Cycle])
def get_bank_cycles(bank_id: str, db: Session = Depends(get_db)):
    """Get all cycles for a specific bank."""
    return cycle_crud.get_cycles_by_bank(db, bank_id)

@router.get("/cycles/{cycle_id}", response_model=Cycle)
def get_cycle(cycle_id: str, db: Session = Depends(get_db)):
    """Get cycle details by ID."""
    db_cycle = cycle_crud.get_cycle(db, cycle_id)
    if db_cycle is None:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return db_cycle

@router.put("/cycles/{cycle_id}/complete", response_model=Cycle)
def complete_cycle(cycle_id: str, complete_data: CycleComplete = Body(None), db: Session = Depends(get_db)):
    """Mark a cycle as complete and calculate duration."""
    end_time = complete_data.end_time if complete_data else datetime.utcnow()
    db_cycle = cycle_crud.complete_cycle(db, cycle_id, end_time)
    if db_cycle is None:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return db_cycle

# Reading Management Endpoints
@router.post("/cycles/{cycle_id}/readings", response_model=Reading, status_code=status.HTTP_201_CREATED)
def create_reading(
    cycle_id: str,
    reading: ReadingCreate,
    db: Session = Depends(get_db)
):
    """Create a new reading for a cycle with cell values."""
    return reading_crud.create_reading(db, cycle_id, reading)

@router.get("/cycles/{cycle_id}/readings", response_model=List[Reading])
def get_cycle_readings(cycle_id: str, db: Session = Depends(get_db)):
    """Get all readings for a specific cycle."""
    return reading_crud.get_readings_by_cycle(db, cycle_id)

@router.get("/readings/{reading_id}", response_model=Reading)
def get_reading(reading_id: str, db: Session = Depends(get_db)):
    """Get reading details by ID."""
    db_reading = reading_crud.get_reading(db, reading_id)
    if db_reading is None:
        raise HTTPException(status_code=404, detail="Reading not found")
    return db_reading

# Export Endpoints
@router.get("/export/bank/{bank_id}")
def export_bank_data(bank_id: str, db: Session = Depends(get_db)):
    """Export bank data as CSV."""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Get bank data
    bank = bank_crud.get_bank(db, bank_id)
    if bank is None:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    # Get test data
    test = test_crud.get_test(db, bank.test_id)
    
    # Get all cycles for this bank
    cycles = cycle_crud.get_cycles_by_bank(db, bank_id)
    
    # Create in-memory file for CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write test metadata (first 5 rows)
    writer.writerow(["Test Summary"])
    writer.writerow(["Job Number:", test.job_number])
    writer.writerow(["Customer Name:", test.customer_name])
    writer.writerow(["Start Date:", test.start_date.strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow(["Status:", test.status])
    writer.writerow(["Number of Cycles:", test.number_of_cycles])
    writer.writerow([])  # Empty row
    
    writer.writerow(["Bank Configuration"])
    writer.writerow(["Bank Number:", bank.bank_number])
    writer.writerow(["Cell Type:", bank.cell_type])
    writer.writerow(["Cell Rate:", bank.cell_rate])
    writer.writerow(["Percentage Capacity:", bank.percentage_capacity])
    writer.writerow(["Discharge Current:", bank.discharge_current])
    writer.writerow(["Number of Cells:", bank.number_of_cells])
    writer.writerow([])  # Empty row
    
    # Group cycles by cycle_number
    cycle_groups = {}
    for cycle in cycles:
        if cycle.cycle_number not in cycle_groups:
            cycle_groups[cycle.cycle_number] = []
        cycle_groups[cycle.cycle_number].append(cycle)
    
    # For each cycle group
    for cycle_number, cycle_group in sorted(cycle_groups.items()):
        writer.writerow([f"Cycle {cycle_number}"])
        
        # Sort by reading_type (charge first, then discharge)
        cycle_group.sort(key=lambda c: 0 if c.reading_type == "charge" else 1)
        
        for cycle in cycle_group:
            writer.writerow([f"  {cycle.reading_type.capitalize()}"])
            writer.writerow(["  Start Time:", cycle.start_time.strftime("%Y-%m-%d %H:%M:%S") if cycle.start_time else "N/A"])
            writer.writerow(["  End Time:", cycle.end_time.strftime("%Y-%m-%d %H:%M:%S") if cycle.end_time else "N/A"])
            writer.writerow(["  Duration (minutes):", cycle.duration if cycle.duration else "N/A"])
            
            # Get all readings for this cycle
            readings = reading_crud.get_readings_by_cycle(db, cycle.id)
            
            if readings:
                # Separate OCV and CCV readings
                ocv_reading = next((r for r in readings if r.is_ocv), None)
                ccv_readings = [r for r in readings if not r.is_ocv]
                ccv_readings.sort(key=lambda r: r.reading_number)
                
                writer.writerow(["  Readings"])
                
                # Create headers for table
                headers = ["Cell Number", "OCV"]
                for idx, ccv in enumerate(ccv_readings, 1):
                    headers.append(f"CCV {idx}")
                
                writer.writerow(["  "] + headers)
                
                # Write values for each cell
                for cell_num in range(1, bank.number_of_cells + 1):
                    row = [f"  {cell_num}"]
                    
                    # Add OCV value if exists
                    if ocv_reading:
                        ocv_value = next((cv.value for cv in ocv_reading.cell_values if cv.cell_number == cell_num), "N/A")
                        row.append(ocv_value)
                    else:
                        row.append("N/A")
                    
                    # Add CCV values
                    for ccv in ccv_readings:
                        ccv_value = next((cv.value for cv in ccv.cell_values if cv.cell_number == cell_num), "N/A")
                        row.append(ccv_value)
                    
                    writer.writerow(row)
            
            writer.writerow([])  # Empty row
    
    # Create response
    output.seek(0)
    filename = f"bank_{bank.bank_number}_test_{test.job_number}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/test/{test_id}")
def export_test_data(test_id: str, db: Session = Depends(get_db)):
    """Export all test data as CSV."""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Get test data
    test = test_crud.get_test(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Create in-memory file for CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write test metadata
    writer.writerow(["Test Summary"])
    writer.writerow(["Job Number:", test.job_number])
    writer.writerow(["Customer Name:", test.customer_name])
    writer.writerow(["Start Date:", test.start_date.strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow(["Status:", test.status])
    writer.writerow(["Number of Cycles:", test.number_of_cycles])
    writer.writerow([])  # Empty row
    
    # Get all banks for this test
    banks = bank_crud.get_banks_by_test(db, test_id)
    
    # For each bank
    for bank in banks:
        writer.writerow([f"Bank {bank.bank_number}"])
        writer.writerow(["Cell Type:", bank.cell_type])
        writer.writerow(["Cell Rate:", bank.cell_rate])
        writer.writerow(["Percentage Capacity:", bank.percentage_capacity])
        writer.writerow(["Discharge Current:", bank.discharge_current])
        writer.writerow(["Number of Cells:", bank.number_of_cells])
        writer.writerow([])  # Empty row
        
        # Get all cycles for this bank
        cycles = cycle_crud.get_cycles_by_bank(db, bank.id)
        
        # Group cycles by cycle_number
        cycle_groups = {}
        for cycle in cycles:
            if cycle.cycle_number not in cycle_groups:
                cycle_groups[cycle.cycle_number] = []
            cycle_groups[cycle.cycle_number].append(cycle)
        
        # For each cycle group
        for cycle_number, cycle_group in sorted(cycle_groups.items()):
            writer.writerow([f"Cycle {cycle_number}"])
            
            # Sort by reading_type (charge first, then discharge)
            cycle_group.sort(key=lambda c: 0 if c.reading_type == "charge" else 1)
            
            for cycle in cycle_group:
                writer.writerow([f"  {cycle.reading_type.capitalize()}"])
                writer.writerow(["  Start Time:", cycle.start_time.strftime("%Y-%m-%d %H:%M:%S") if cycle.start_time else "N/A"])
                writer.writerow(["  End Time:", cycle.end_time.strftime("%Y-%m-%d %H:%M:%S") if cycle.end_time else "N/A"])
                writer.writerow(["  Duration (minutes):", cycle.duration if cycle.duration else "N/A"])
                
                # Get all readings for this cycle
                readings = reading_crud.get_readings_by_cycle(db, cycle.id)
                
                if readings:
                    # Separate OCV and CCV readings
                    ocv_reading = next((r for r in readings if r.is_ocv), None)
                    ccv_readings = [r for r in readings if not r.is_ocv]
                    ccv_readings.sort(key=lambda r: r.reading_number)
                    
                    writer.writerow(["  Readings"])
                    
                    # Create headers for table
                    headers = ["Cell Number", "OCV"]
                    for idx, ccv in enumerate(ccv_readings, 1):
                        headers.append(f"CCV {idx}")
                    
                    writer.writerow(["  "] + headers)
                    
                    # Write values for each cell
                    for cell_num in range(1, bank.number_of_cells + 1):
                        row = [f"  {cell_num}"]
                        
                        # Add OCV value if exists
                        if ocv_reading:
                            ocv_value = next((cv.value for cv in ocv_reading.cell_values if cv.cell_number == cell_num), "N/A")
                            row.append(ocv_value)
                        else:
                            row.append("N/A")
                        
                        # Add CCV values
                        for ccv in ccv_readings:
                            ccv_value = next((cv.value for cv in ccv.cell_values if cv.cell_number == cell_num), "N/A")
                            row.append(ccv_value)
                        
                        writer.writerow(row)
                
                writer.writerow([])  # Empty row
    
    # Create response
    output.seek(0)
    filename = f"test_{test.job_number}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )