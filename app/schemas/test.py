from pydantic import BaseModel, Field, UUID4, validator
from datetime import datetime
from typing import Optional, List, Union
from enum import Enum

class TestStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class CellType(str, Enum):
    KPL = "KPL"
    KPM = "KPM"
    KPH = "KPH"

# Bank Schemas
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

# Test Schemas
class TestBase(BaseModel):
    job_number: str
    customer_name: str
    number_of_cycles: int = Field(..., ge=1, le=5)
    time_interval: int = Field(..., ge=1, le=2)  # 1 or 2 hours
    start_date: datetime

class TestCreate(TestBase):
    banks: List[BankCreate]

class TestStatusUpdate(BaseModel):
    status: TestStatus

class Test(TestBase):
    id: UUID4
    status: TestStatus
    created_at: datetime
    banks: List[Bank]

    class Config:
        from_attributes = True

# Cycle Schemas
class CycleBase(BaseModel):
    cycle_number: int = Field(..., ge=1)
    reading_type: str = Field(..., pattern="^(charge|discharge)$")

class CycleCreate(CycleBase):
    start_time: Optional[datetime] = None

class CycleComplete(BaseModel):
    end_time: Optional[datetime] = None

class Cycle(CycleBase):
    id: UUID4
    bank_id: UUID4
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None  # in minutes

    class Config:
        from_attributes = True

# Reading Schemas
class ReadingBase(BaseModel):
    timestamp: Optional[datetime] = None
    is_ocv: bool
    reading_number: int

class ReadingCreate(ReadingBase):
    cell_values: List[float]
    time_interval: Optional[int] = None  # Time interval in minutes (for CCV readings)
    
    @validator('cell_values')
    def validate_cell_values(cls, v):
        # Each value should be between 2.0 and 5.0 volts
        for value in v:
            if value < 2.0 or value > 5.0:
                raise ValueError(f"Cell value {value} is outside valid range (2.0-5.0V)")
        return v
    
    @validator('time_interval')
    def validate_time_interval(cls, v, values):
        # Only validate time_interval for CCV readings
        if v is not None and not values.get('is_ocv', True):
            if v < 1 or v > 120:
                raise ValueError("Time interval must be between 1 and 120 minutes")
        return v

class CellValueBase(BaseModel):
    cell_number: int
    value: float

class CellValue(CellValueBase):
    id: UUID4
    reading_id: UUID4

    class Config:
        from_attributes = True

class Reading(ReadingBase):
    id: UUID4
    cycle_id: UUID4
    cell_values: List[CellValue]

    class Config:
        from_attributes = True
