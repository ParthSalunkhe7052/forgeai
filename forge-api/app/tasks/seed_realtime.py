from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import SessionLocal
from app.models import Machine, SensorReading, ProductionRecord
from app.services.rules_engine import rules_engine
import random
import math

async def simulate_telemetry_tick():
    """Runs periodically to append new sensor readings and update production rates"""
    async with SessionLocal() as db:
        # 1. Fetch machines
        stmt = select(Machine)
        result = await db.execute(stmt)
        machines = result.scalars().all()
        
        now = datetime.utcnow()
        
        for m in machines:
            # Generate a vibration reading
            vibe_val = 2.1 + random.uniform(-0.15, 0.15)
            
            # Pune Furnace-2 bearing vibration continues to degrade
            if m.name == "Pune Furnace-2":
                # Calculate hours since seed base start (e.g. let's just make it spike around 3.8-4.2)
                vibe_val = 3.85 + random.uniform(-0.1, 0.2)
                
            db.add(SensorReading(
                machine_id=m.id,
                sensor_type="vibration",
                value=vibe_val,
                unit="mm/s",
                quality_score=0.98,
                recorded_at=now
            ))
            
            # Generate temperature reading for furnaces
            if m.machine_type == "furnace":
                temp_val = 1530.0 + random.uniform(-15.0, 15.0)
                if m.name == "Pune Furnace-2":
                    temp_val += 40.0 # Running hot due to friction
                    
                db.add(SensorReading(
                    machine_id=m.id,
                    sensor_type="temperature",
                    value=temp_val,
                    unit="°C",
                    quality_score=0.99,
                    recorded_at=now
                ))
                
        # 2. Update current day production pace metrics
        # Jitter OEE parameters on today's records
        prod_stmt = select(ProductionRecord).where(ProductionRecord.date == datetime.utcnow().date())
        prod_res = await db.execute(prod_stmt)
        records = prod_res.scalars().all()
        
        for r in records:
            r.actual_tons += random.uniform(-0.5, 0.6)
            r.defect_tons += random.uniform(-0.02, 0.03)
            # Recompute OEE slightly
            r.oee_score = max(40.0, min(100.0, r.oee_score + random.uniform(-0.5, 0.5)))
            
        await db.commit()
        
        # 3. Evaluate rules to verify if any new alerts trigger
        for p_id in list(set([m.plant_id for m in machines])):
            await rules_engine.evaluate_rules(db, p_id)
            
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Live telemetry simulator tick processed.")
