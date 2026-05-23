from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Plant, Machine, SensorReading, ProductionRecord
from app.services.analytics import analytics_engine
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/plants", tags=["Plants"])

@router.get("")
async def list_plants(db: AsyncSession = Depends(get_db)):
    stmt = select(Plant).order_by(Plant.name.asc())
    result = await db.execute(stmt)
    plants = result.scalars().all()
    
    # Enrich with line counts and machine counts
    enriched_plants = []
    for plant in plants:
        # Count lines
        lines_stmt = select(func.count()).select_from(Machine).where(Machine.plant_id == plant.id)
        # Note: machines count
        machines_stmt = select(func.count(Machine.id)).where(Machine.plant_id == plant.id)
        
        mach_count = await db.scalar(machines_stmt) or 0
        
        # Get latest OEE
        oee_data = await analytics_engine.calculate_oee(db, plant.id, days=7)
        
        enriched_plants.append({
            "id": plant.id,
            "name": plant.name,
            "location": plant.location,
            "capacity_tons_per_day": plant.capacity_tons_per_day,
            "status": plant.status,
            "machine_count": mach_count,
            "oee": oee_data["oee"]
        })
        
    return enriched_plants

@router.get("/{plant_id}/summary")
async def get_plant_summary(plant_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Plant).where(Plant.id == plant_id)
    plant = (await db.execute(stmt)).scalar_one_or_none()
    
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    oee_data = await analytics_engine.calculate_oee(db, plant_id, days=30)
    utilization = await analytics_engine.calculate_plant_utilization(db, plant_id, days=30)
    
    # Get counts
    machines_stmt = select(func.count(Machine.id)).where(Machine.plant_id == plant_id)
    machine_count = await db.scalar(machines_stmt) or 0
    
    degraded_stmt = select(func.count(Machine.id)).where(
        Machine.plant_id == plant_id,
        Machine.status != "operational"
    )
    degraded_count = await db.scalar(degraded_stmt) or 0
    
    return {
        "id": plant.id,
        "name": plant.name,
        "location": plant.location,
        "status": plant.status,
        "kpis": {
            "oee": oee_data["oee"],
            "availability": oee_data["availability"],
            "performance": oee_data["performance"],
            "quality": oee_data["quality"],
            "utilization": utilization
        },
        "machine_count": machine_count,
        "degraded_machine_count": degraded_count
    }

@router.get("/{plant_id}/machines")
async def get_plant_machines(plant_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Machine).where(Machine.plant_id == plant_id).order_by(Machine.name.asc())
    result = await db.execute(stmt)
    machines = result.scalars().all()
    return machines

@router.get("/{plant_id}/machines/{machine_id}/sensors")
async def get_machine_sensors(
    plant_id: str,
    machine_id: str,
    sensor_type: str = Query(..., description="vibration or temperature"),
    days: int = Query(14, description="Days of history"),
    db: AsyncSession = Depends(get_db)
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    stmt = select(SensorReading).where(
        SensorReading.machine_id == machine_id,
        SensorReading.sensor_type == sensor_type,
        SensorReading.recorded_at >= cutoff
    ).order_by(SensorReading.recorded_at.asc())
    
    result = await db.execute(stmt)
    readings = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "value": r.value,
            "unit": r.unit,
            "recorded_at": r.recorded_at
        }
        for r in readings
    ]
