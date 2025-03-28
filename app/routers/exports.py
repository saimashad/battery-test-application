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
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
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

@router.get("/tests/{test_id}/export/pdf")
async def export_pdf(test_id: int, db: Session = Depends(database.get_db)):
    test = crud.get_test(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")

    # Create a temporary file for the PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        # Create the PDF document
        doc = SimpleDocTemplate(
            temp_file.name,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        # Container for the 'Flowable' objects
        elements = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        heading_style = styles['Heading2']
        normal_style = styles['Normal']

        # Add title
        elements.append(Paragraph(f"Battery Test Report - {test.bank.name}", title_style))
        elements.append(Spacer(1, 12))
        
        # Add test information
        elements.append(Paragraph("Test Information", heading_style))
        
        # Format status properly
        status_text = test.status.capitalize() if hasattr(test, 'status') else 'Unknown'
        
        test_info = [
            ["Test ID:", str(test.id)],
            ["Status:", status_text],
            ["Total Cycles:", str(test.total_cycles)],
            ["Generated:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
        ]
        
        t = Table(test_info, colWidths=[2*inch, 4*inch])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

        # Add cycle data
        for cycle in test.cycles:
            elements.append(Paragraph(f"Cycle {cycle.cycle_number}", heading_style))
            
            # Prepare readings table data
            headers = ['Cell #', 'OCV (V)']
            ccv_readings = [r for r in cycle.readings if r.reading_type == "CCV"]
            ccv_sequences = sorted(set(r.sequence_number for r in ccv_readings if r.sequence_number is not None))
            
            for seq in ccv_sequences:
                headers.append(f'CCV {seq} (V)')
            
            table_data = [headers]
            
            for cell in range(1, test.bank.num_cells + 1):
                row = [str(cell)]
                # Add OCV reading
                ocv = next((r for r in cycle.readings 
                         if r.reading_type == "OCV" and r.cell_number == cell), None)
                row.append(f"{ocv.value:.2f}" if ocv and hasattr(ocv, 'value') else '-')
                
                # Add CCV readings
                for seq in ccv_sequences:
                    ccv = next((r for r in ccv_readings 
                            if r.sequence_number == seq and r.cell_number == cell), None)
                    row.append(f"{ccv.value:.2f}" if ccv and hasattr(ccv, 'value') else '-')
                
                table_data.append(row)
            
            # Create and style the table
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            elements.append(t)
            
            if hasattr(cycle, 'end_time') and cycle.end_time:
                duration = format_duration(cycle.start_time, cycle.end_time)
                elements.append(Paragraph(f"Duration: {duration}", normal_style))
            
            elements.append(Spacer(1, 12))

        # Build the PDF
        doc.build(elements)
        
        return FileResponse(
            temp_file.name,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=test_{test_id}_report.pdf"}
        )