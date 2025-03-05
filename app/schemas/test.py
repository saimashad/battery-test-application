from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TestStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class CellType(str, Enum):
    KPL = "KPL"
    KPM = "KPM"
    KPH = "KPH"

class BankBase(BaseModel):
    bank_number: int = Field(..., ge=1, le=2)
    cell_type: CellType
    cell_rate: float = Field(..., gt=0)
    percentage_capacity: float = Field(..., gt=0, le=100)
    number_of_cells: int = Field(..., ge=10, le=200)

class BankCreate(BankBase):
    pass

class Bank(BankBase):
    id: UUID4
    test_id: UUID4
    discharge_current: float

    class Config:
        from_attributes = True

class TestBase(BaseModel):
    job_number: str
    customer_name: str
    number_of_cycles: int = Field(..., ge=1, le=5)
    time_interval: int = Field(..., ge=1, le=2)  # 1 or 2 hours
    start_date: datetime

class TestCreate(TestBase):
    banks: List[BankCreate]

class Test(TestBase):
    id: UUID4
    status: TestStatus
    created_at: datetime
    banks: List[Bank]

    class Config:
        from_attributes = True

class ReadingBase(BaseModel):
    cell_values: List[float]
    timestamp: Optional[datetime] = None

class ReadingCreate(ReadingBase):
    pass

class Reading(ReadingBase):
    id: UUID4
    cycle_id: UUID4
    reading_number: int
    is_ocv: bool

    class Config:
        from_attributes = True 