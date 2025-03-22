from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from fastapi.responses import StreamingResponse, FileResponse
import pandas as pd
import io
from datetime import datetime
import os
import tempfile
from fastapi.templating import Jinja2Templates
from pathlib import Path
#from weasyprint import HTML
from ..routers.tests import format_duration

router = APIRouter(
    prefix="/api",
    tags=["exports"],
    responses={404: {"description": "Not found"}},
)

templates = Jinja2Templates(directory="app/templates")

@router.get("/tests/{test_id}/export")
async def export_csv(test_id: int, db: Session = Depends(database.get_db)):
    test = crud.get_test(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    
    export_data = []

    for cycle in test.cycles:
        # Get all CCV readings for this cycle
        ccv_readings = [r for r in cycle.readings if r.reading_type == "CCV"]
        ccv_sequences = sorted(set(r.sequence_number for r in ccv_readings if r.sequence_number is not None))

        # Prepare data for each cell
        for cell_num in range(1, test.bank.num_cells + 1):
            row = {
                'Cycle': cycle.cycle_number,
                'Phase': cycle.phase.capitalize(),
                'Cell No.': cell_num
            }

            # Add OCV reading
            ocv = next((r for r in cycle.readings 
                     if r.reading_type == "OCV" and r.cell_number == cell_num), None)
            row['OCV'] = f"{ocv.value:.2f}" if ocv else '-'

            # Add CCV readings with timestamps
            for seq in ccv_sequences:
                ccv = next((r for r in ccv_readings 
                        if r.sequence_number == seq and r.cell_number == cell_num), None)
                header = f"CCV-{seq} ({ccv.timestamp.strftime('%I:%M %p') if ccv else ''})"
                row[header] = f"{ccv.value:.2f}" if ccv else '-'

            export_data.append(row)

    # Create DataFrame and sort
    df = pd.DataFrame(export_data)
    if not df.empty:
        df = df.sort_values(['Cycle', 'Phase', 'Cell No.'])

    # Export to CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=test_{test_id}_export.csv"}
    )

'''@router.get("/tests/{test_id}/export/pdf")
async def export_pdf(test_id: int, db: Session = Depends(database.get_db)):
    test = crud.get_test(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Create a template context
    context = {
        "test": test,
        "format_duration": format_duration,
        "export_mode": True,
        "request": None  # Required for Jinja2Templates but not used in this case
    }
    
    # Generate HTML content using a template
    html_content = templates.get_template("test_details.html").render(context)
    
    # Create a temporary file to store the PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        # Convert HTML to PDF
        HTML(string=html_content).write_pdf(temp_file.name)
        
        # Return the PDF file
        return FileResponse(
            temp_file.name,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=test_{test_id}_report.pdf"}
        )'''