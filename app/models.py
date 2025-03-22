from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class BatteryBank(Base):
    __tablename__ = "battery_banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    num_cells = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tests = relationship("TestSession", back_populates="bank")

class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("battery_banks.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="scheduled")  # scheduled, in_progress, completed
    total_cycles = Column(Integer, nullable=False)
    current_cycle = Column(Integer, default=1)
    current_phase = Column(String(20), default="charge")  # charge, discharge
    
    # Relationships
    bank = relationship("BatteryBank", back_populates="tests")
    cycles = relationship("ReadingCycle", back_populates="test")

    def update_status(self):
        if not self.cycles:
            self.status = "scheduled"
        elif self.current_cycle > self.total_cycles:
            self.status = "completed"
        else:
            self.status = "in_progress"

class ReadingCycle(Base):
    __tablename__ = "reading_cycles"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    cycle_number = Column(Integer, nullable=False)
    phase = Column(String(20), nullable=False)  # charge, discharge
    ccv_interval = Column(Integer)  # interval in seconds
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active, completed
    
    # Relationships
    test = relationship("TestSession", back_populates="cycles")
    readings = relationship("Reading", back_populates="cycle")

    def get_readings_by_type(self, reading_type):
        return [r for r in self.readings if r.reading_type == reading_type]

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("reading_cycles.id"), nullable=False)
    reading_type = Column(String(3), nullable=False)  # OCV, CCV
    cell_number = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    sequence_number = Column(Integer, nullable=True)  # For CCV readings
    timestamp = Column(DateTime, default=datetime.utcnow)
    phase = Column(String(20), nullable=False)  # charge, discharge
    
    # Relationships
    cycle = relationship("ReadingCycle", back_populates="readings")