import uvicorn
from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from pathlib import Path
from sqlalchemy.orm import Session

from .database import get_db
from . import models, crud
from .routers import tests, cycles, readings, exports

# Remove database creation line since Alembic will handle this
# models.Base.metadata.create_all(bind=engine)  <- removed

app = FastAPI(
    title="Battery Bank Tracker",
    description="An application for tracking battery bank tests",
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Configure templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
app.include_router(tests.router)
app.include_router(cycles.router)
app.include_router(readings.router)
app.include_router(exports.router)

# Helper function to get test progress
def get_test_progress(test):
    total_phases = test.total_cycles * 2  # Each cycle has charge and discharge
    completed_phases = (test.current_cycle - 1) * 2
    if test.current_phase == "discharge":
        completed_phases += 1
    return (completed_phases / total_phases) * 100

@app.get("/", response_class=HTMLResponse)
async def root(request: Request, db: Session = Depends(get_db)):
    tests = crud.get_tests(db)
    return templates.TemplateResponse(
        "dashboard.html", 
        {"request": request, "tests": tests, "get_test_progress": get_test_progress}
    )

@app.get("/create_test", response_class=HTMLResponse)
async def create_test_page(request: Request):
    return templates.TemplateResponse("create_test.html", {"request": request})

@app.post("/create_test")
async def create_test(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    bank = models.BatteryBank(
        name=form.get("name"),
        description=form.get("description"),
        num_cells=int(form.get("num_cells"))
    )
    db.add(bank)
    db.flush()
    
    test = models.TestSession(
        bank_id=bank.id,
        total_cycles=int(form.get("total_cycles"))
    )
    db.add(test)
    db.commit()
    
    return {"success": True, "test_id": test.id}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.0", port=8000, reload=True)