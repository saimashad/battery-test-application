from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from .session import Base

class TestStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class CellType(str, enum.Enum):
    KPL = "KPL"
    KPM = "KPM"
    KPH = "KPH"

class Test(Base):
    __tablename__ = "tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_number = Column(String, unique=True, index=True)
    customer_name = Column(String)
    start_date = Column(DateTime)
    start_time = Column(DateTime)
    number_of_cycles = Column(Integer)
    status = Column(SQLEnum(TestStatus), default=TestStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    banks = relationship("Bank", back_populates="test", cascade="all, delete-orphan")

class Bank(Base):
    __tablename__ = "banks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id"))
    bank_number = Column(Integer)
    cell_type = Column(SQLEnum(CellType))
    cell_rate = Column(Float)
    percentage_capacity = Column(Float)
    discharge_current = Column(Float)
    number_of_cells = Column(Integer)

    # Relationships
    test = relationship("Test", back_populates="banks")
    cycles = relationship("Cycle", back_populates="bank", cascade="all, delete-orphan")

class Cycle(Base):
    __tablename__ = "cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_id = Column(UUID(as_uuid=True), ForeignKey("banks.id"))
    cycle_number = Column(Integer)
    reading_type = Column(String)  # charge/discharge
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # in minutes

    # Relationships
    bank = relationship("Bank", back_populates="cycles")
    readings = relationship("Reading", back_populates="cycle", cascade="all, delete-orphan")

class Reading(Base):
    __tablename__ = "readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cycle_id = Column(UUID(as_uuid=True), ForeignKey("cycles.id"))
    reading_number = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_ocv = Column(Boolean)
    time_interval = Column(Integer, nullable=True)  # Time interval in minutes (for CCV readings)

    # Relationships
    cycle = relationship("Cycle", back_populates="readings")
    cell_values = relationship("CellValue", back_populates="reading", cascade="all, delete-orphan")

class CellValue(Base):
    __tablename__ = "cell_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reading_id = Column(UUID(as_uuid=True), ForeignKey("readings.id"))
    cell_number = Column(Integer)
    value = Column(Float)

    # Relationships
    reading = relationship("Reading", back_populates="cell_values")