from datetime import datetime, date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ProductionRecord, DowntimeEvent, Machine, Plant

class AnalyticsEngine:
    async def calculate_oee(self, db: AsyncSession, plant_id: str, days: int = 30):
        # OEE = Availability × Performance × Quality
        # Fetch production records for the plant and period
        start_date = date.today() - timedelta(days=days)
        stmt = select(ProductionRecord).where(
            ProductionRecord.plant_id == plant_id,
            ProductionRecord.date >= start_date
        )
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        if not records:
            return {"oee": 0.0, "availability": 0.0, "performance": 0.0, "quality": 0.0}
            
        total_target = sum(r.target_tons for r in records)
        total_actual = sum(r.actual_tons for r in records)
        total_defect = sum(r.defect_tons for r in records)
        
        # Calculate OEE components
        avg_availability = sum(r.availability for r in records) / len(records)
        avg_performance = sum(r.performance for r in records) / len(records)
        avg_quality = sum(r.quality for r in records) / len(records)
        
        composite_oee = (avg_availability / 100.0) * (avg_performance / 100.0) * (avg_quality / 100.0) * 100.0
        
        return {
            "oee": round(composite_oee, 1),
            "availability": round(avg_availability, 1),
            "performance": round(avg_performance, 1),
            "quality": round(avg_quality, 1)
        }

    async def calculate_mtbf(self, db: AsyncSession, machine_id: str, days: int = 90):
        # Mean Time Between Failures
        # MTBF = Total Uptime / Number of Failures
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Count downtime events for this machine
        stmt = select(func.count(DowntimeEvent.id)).where(
            DowntimeEvent.machine_id == machine_id,
            DowntimeEvent.started_at >= start_date,
            DowntimeEvent.cause_category != "planned"
        )
        failures = await db.scalar(stmt) or 0
        
        total_hours = days * 24.0
        # Calculate total downtime duration in hours
        stmt_downtime = select(func.sum(DowntimeEvent.duration_minutes)).where(
            DowntimeEvent.machine_id == machine_id,
            DowntimeEvent.started_at >= start_date
        )
        downtime_minutes = await db.scalar(stmt_downtime) or 0
        downtime_hours = downtime_minutes / 60.0
        
        uptime_hours = total_hours - downtime_hours
        
        if failures == 0:
            return round(uptime_hours, 1)  # If no failures, MTBF is the uptime itself
            
        return round(uptime_hours / failures, 1)

    async def calculate_mttr(self, db: AsyncSession, machine_id: str, days: int = 90):
        # Mean Time To Repair
        # MTTR = Total Downtime / Number of Repairs
        start_date = datetime.utcnow() - timedelta(days=days)
        
        stmt = select(DowntimeEvent).where(
            DowntimeEvent.machine_id == machine_id,
            DowntimeEvent.started_at >= start_date,
            DowntimeEvent.ended_at.isnot(None)
        )
        result = await db.execute(stmt)
        events = result.scalars().all()
        
        if not events:
            return 0.0
            
        total_downtime_hours = sum(e.duration_minutes for e in events) / 60.0
        return round(total_downtime_hours / len(events), 1)

    async def calculate_plant_utilization(self, db: AsyncSession, plant_id: str, days: int = 30):
        # Utilization = Actual Tons Produced / Capacity Tons
        start_date = date.today() - timedelta(days=days)
        
        # Get plant capacity
        plant_stmt = select(Plant).where(Plant.id == plant_id)
        plant = (await db.execute(plant_stmt)).scalar_one_or_none()
        if not plant or not plant.capacity_tons_per_day:
            return 0.0
            
        # Get production
        prod_stmt = select(func.sum(ProductionRecord.actual_tons)).where(
            ProductionRecord.plant_id == plant_id,
            ProductionRecord.date >= start_date
        )
        actual_produced = await db.scalar(prod_stmt) or 0.0
        total_capacity = plant.capacity_tons_per_day * days
        
        utilization = (actual_produced / total_capacity) * 100.0
        return round(min(100.0, max(0.0, utilization)), 1)

analytics_engine = AnalyticsEngine()
