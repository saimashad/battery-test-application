from pydantic import BaseModel, Field, validator
from typing import List, Optional, Union
from datetime import datetime
from enum import Enum

# Enums
class TestStatus(str, Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"

class Phase(str, Enum):
    charge = "charge"
    discharge = "discharge"

class ReadingType(str, Enum):
    OCV = "OCV"
    CCV = "CCV"

# Base schemas
class BankBase(BaseModel):
    name: str
    description: Optional[str] = None
    num_cells: int = Field(..., gt=0, le=200)

class TestBase(BaseModel):
    bank_id: Optional[int] = None
    total_cycles: int = Field(..., gt=0, le=5)

class ReadingBase(BaseModel):
    cell_number: int
    value: float
    reading_type: ReadingType
    phase: Phase

# Create schemas
class BankCreate(BankBase):
    pass

class TestCreate(TestBase):
    bank: BankBase

class CycleCreate(BaseModel):
    test_id: int
    cycle_number: int
    phase: Phase
    ccv_interval: Optional[int] = None

class ReadingCreate(ReadingBase):
    cycle_id: int
    sequence_number: Optional[int] = None

# Bulk reading submission
class BulkReadingsCreate(BaseModel):
    readings: List[float]

# Response schemas
class Bank(BankBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Reading(ReadingBase):
    id: int
    cycle_id: int
    sequence_number: Optional[int] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class Cycle(BaseModel):
    id: int
    test_id: int
    cycle_number: int
    phase: Phase
    ccv_interval: Optional[int] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str
    readings: List[Reading] = []

    class Config:
        from_attributes = True

class Test(BaseModel):
    id: int
    bank_id: int
    start_time: datetime
    status: TestStatus
    total_cycles: int
    current_cycle: int
    current_phase: Phase
    bank: Bank
    cycles: List[Cycle] = []

    @property
    def formatted_status(self):
        return self.status.value.replace('_', ' ').title()

    class Config:
        from_attributes = True

# Status update schemas
class TestStatusUpdate(BaseModel):
    status: TestStatus

class CycleStatusUpdate(BaseModel):
    status: str = "completed"
    end_time: Optional[datetime] = None