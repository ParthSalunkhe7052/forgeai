import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, ForeignKey, Text, JSON, Numeric
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from app.database import Base, is_sqlite

# Define a fallback Vector type for SQLite
if is_sqlite:
    # In SQLite, store vector data as JSON array
    from sqlalchemy.types import TypeDecorator
    import json
    
    class VectorFallback(TypeDecorator):
        impl = Text
        cache_ok = True
        
        def process_bind_param(self, value, dialect):
            if value is not None:
                return json.dumps(value)
            return None
            
        def process_result_value(self, value, dialect):
            if value is not None:
                return json.loads(value)
            return None
            
    VectorType = VectorFallback
else:
    from pgvector.sqlalchemy import Vector
    VectorType = Vector(1536)

# Custom UUID generator helper
def get_uuid():
    return str(uuid.uuid4())

class Plant(Base):
    __tablename__ = "plants"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    capacity_tons_per_day = Column(Integer)
    status = Column(String(20), default="operational")  # operational | maintenance | offline
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lines = relationship("ProductionLine", back_populates="plant", cascade="all, delete-orphan")
    machines = relationship("Machine", back_populates="plant", cascade="all, delete-orphan")
    production_records = relationship("ProductionRecord", back_populates="plant")
    downtime_events = relationship("DowntimeEvent", back_populates="plant")
    inventory = relationship("Inventory", back_populates="plant")
    shipments = relationship("Shipment", back_populates="plant")
    financial_records = relationship("FinancialRecord", back_populates="plant")
    work_orders = relationship("WorkOrder", back_populates="plant")
    ai_insights = relationship("AIInsight", back_populates="plant")

class ProductionLine(Base):
    __tablename__ = "production_lines"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    name = Column(String(100), nullable=False)
    line_type = Column(String(50))  # rolling | casting | finishing | annealing
    capacity_tons_per_hour = Column(Float)
    status = Column(String(20), default="running")  # running | idle | maintenance | fault
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plant = relationship("Plant", back_populates="lines")
    machines = relationship("Machine", back_populates="line", cascade="all, delete-orphan")
    production_records = relationship("ProductionRecord", back_populates="line")
    work_orders = relationship("WorkOrder", back_populates="line")

class Machine(Base):
    __tablename__ = "machines"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    line_id = Column(String(36), ForeignKey("production_lines.id"))
    name = Column(String(100), nullable=False)
    machine_type = Column(String(50))  # furnace | conveyor | roller | crane | sensor
    manufacturer = Column(String(100))
    installation_date = Column(Date)
    last_maintenance = Column(Date)
    next_maintenance = Column(Date)
    health_score = Column(Float)  # 0-100
    status = Column(String(20), default="operational")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plant = relationship("Plant", back_populates="machines")
    line = relationship("ProductionLine", back_populates="machines")
    sensor_readings = relationship("SensorReading", back_populates="machine", cascade="all, delete-orphan")
    downtime_events = relationship("DowntimeEvent", back_populates="machine")
    maintenance_logs = relationship("MaintenanceLog", back_populates="machine")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(36), ForeignKey("machines.id"))
    sensor_type = Column(String(50))  # temperature | vibration | pressure | current | flow
    value = Column(Float)
    unit = Column(String(20))
    quality_score = Column(Float)  # 0-1
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    machine = relationship("Machine", back_populates="sensor_readings")

class ProductionRecord(Base):
    __tablename__ = "production_records"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    line_id = Column(String(36), ForeignKey("production_lines.id"))
    shift = Column(String(10))  # morning | evening | night
    date = Column(Date, nullable=False)
    target_tons = Column(Float)
    actual_tons = Column(Float)
    defect_tons = Column(Float)
    scrap_tons = Column(Float)
    oee_score = Column(Float)  # 0-100
    availability = Column(Float)
    performance = Column(Float)
    quality = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plant = relationship("Plant", back_populates="production_records")
    line = relationship("ProductionLine", back_populates="production_records")

class DowntimeEvent(Base):
    __tablename__ = "downtime_events"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    machine_id = Column(String(36), ForeignKey("machines.id"))
    plant_id = Column(String(36), ForeignKey("plants.id"))
    cause_category = Column(String(50))  # mechanical | electrical | process | planned | external
    cause_detail = Column(Text)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer)  # calculated
    impact_tons = Column(Float)
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    machine = relationship("Machine", back_populates="downtime_events")
    plant = relationship("Plant", back_populates="downtime_events")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    machine_id = Column(String(36), ForeignKey("machines.id"))
    maintenance_type = Column(String(30))  # preventive | corrective | predictive
    technician = Column(String(100))
    work_order = Column(String(50))
    description = Column(Text)
    parts_replaced = Column(JSON)  # Store list of strings
    cost_inr = Column(Float)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    next_scheduled = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    machine = relationship("Machine", back_populates="maintenance_logs")

class EnergyRecord(Base):
    __tablename__ = "energy_records"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    line_id = Column(String(36), ForeignKey("production_lines.id"))
    recorded_hour = Column(DateTime, nullable=False)
    kwh_consumed = Column(Float)
    cost_inr = Column(Float)
    peak_demand_kw = Column(Float)
    energy_intensity = Column(Float)  # kwh per ton

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    material_type = Column(String(50))  # iron_ore | coal | limestone | billets | finished_steel
    material_grade = Column(String(50))
    quantity_tons = Column(Float)
    reorder_level = Column(Float)
    unit_cost_inr = Column(Float)
    supplier = Column(String(100))
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plant = relationship("Plant", back_populates="inventory")

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    shipment_type = Column(String(10))  # inbound | outbound
    material_type = Column(String(50))
    quantity_tons = Column(Float)
    origin = Column(String(200))
    destination = Column(String(200))
    carrier = Column(String(100))
    scheduled_date = Column(Date)
    actual_date = Column(Date, nullable=True)
    status = Column(String(20))  # scheduled | in_transit | delayed | delivered | cancelled
    delay_reason = Column(Text)
    value_inr = Column(Float)

    # Relationships
    plant = relationship("Plant", back_populates="shipments")

class FinancialRecord(Base):
    __tablename__ = "financial_records"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    month = Column(Date, nullable=False)
    revenue_inr = Column(Float)
    cost_of_goods_inr = Column(Float)
    energy_cost_inr = Column(Float)
    maintenance_cost_inr = Column(Float)
    labor_cost_inr = Column(Float)
    logistics_cost_inr = Column(Float)
    gross_profit_inr = Column(Float)
    net_profit_inr = Column(Float)
    tons_produced = Column(Float)
    tons_sold = Column(Float)

    # Relationships
    plant = relationship("Plant", back_populates="financial_records")

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    line_id = Column(String(36), ForeignKey("production_lines.id"))
    order_number = Column(String(50), unique=True)
    product_type = Column(String(100))
    quantity_tons = Column(Float)
    priority = Column(String(10))  # urgent | high | normal | low
    status = Column(String(20))  # pending | in_progress | completed | cancelled
    assigned_team = Column(String(100))
    due_date = Column(Date)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text)

    # Relationships
    plant = relationship("Plant", back_populates="work_orders")
    line = relationship("ProductionLine", back_populates="work_orders")

class AIInsight(Base):
    __tablename__ = "ai_insights"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    plant_id = Column(String(36), ForeignKey("plants.id"))
    insight_type = Column(String(30))  # recommendation | alert | summary | prediction | rca
    role_target = Column(String(20))  # cxo | technical | floor | all
    title = Column(String(200))
    body = Column(Text, nullable=False)
    severity = Column(String(20))  # info | warning | critical | opportunity
    confidence_score = Column(Float)  # 0-1
    data_snapshot = Column(JSON)  # data associated with insight
    embedding = Column(VectorType, nullable=True)
    is_active = Column(Boolean, default=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    plant = relationship("Plant", back_populates="ai_insights")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String(36), primary_key=True, default=get_uuid)
    session_id = Column(String(36), nullable=False)
    user_id = Column(String(100), nullable=True)
    role = Column(String(10))  # user | assistant
    content = Column(Text, nullable=False)
    role_context = Column(String(20))  # cxo | technical | floor
    plant_id = Column(String(36), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
