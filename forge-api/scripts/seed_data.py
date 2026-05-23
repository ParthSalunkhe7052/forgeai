import asyncio
import os
import sys
from datetime import datetime, timedelta, date
import random
import math

# Add parent directory to path so app imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models import (
    Plant, ProductionLine, Machine, SensorReading, ProductionRecord,
    DowntimeEvent, MaintenanceLog, EnergyRecord, Inventory, Shipment,
    FinancialRecord, WorkOrder, AIInsight
)

# ----------------- Configuration & Seed Data Helper -----------------

PLANT_SPECS = [
    {
        "name": "Plant A — Mumbai",
        "location": "Mumbai, Maharashtra",
        "capacity_tons_per_day": 800,
        "status": "operational",
        "oee_target": 82.0
    },
    {
        "name": "Plant B — Pune",
        "location": "Pune, Maharashtra",
        "capacity_tons_per_day": 600,
        "status": "partially degraded",
        "oee_target": 67.0
    },
    {
        "name": "Plant C — Surat",
        "location": "Surat, Gujarat",
        "capacity_tons_per_day": 500,
        "status": "operational",
        "oee_target": 91.0
    }
]

LINE_TYPES = [
    ("Blast Furnace Line", "rolling", 35.0),
    ("Electric Arc Furnace Line", "casting", 30.0),
    ("Rolling Mill Line", "finishing", 40.0),
    ("Finishing Line", "finishing", 25.0),
    ("Cold Rolling Line", "annealing", 20.0)
]

MACHINE_TYPES = [
    ("Furnace", "furnace", "SMS Group"),
    ("Conveyor Belt", "conveyor", "Metso Outotec"),
    ("Main Roller", "roller", "Primetals Technologies"),
    ("Charge Crane", "crane", "Konecranes"),
    ("Cooling Fan", "sensor", "Siemens")
]

async def seed():
    print("Starting database seeding...")
    
    # 1. Create tables if they do not exist
    async with engine.begin() as conn:
        print("Creating database schema...")
        if engine.dialect.name == "postgresql":
            from sqlalchemy import text
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            print("pgvector extension enabled.")
        # Drop all tables to clean old schema constraints
        await conn.run_sync(Base.metadata.drop_all)
        print("Old schema dropped.")
        await conn.run_sync(Base.metadata.create_all)
        print("Schema created.")
        
    async with SessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        plant_count = await db.scalar(select(func.count(Plant.id)))
        if plant_count > 0:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding Plants...")
        plants_dict = {}
        for spec in PLANT_SPECS:
            plant = Plant(
                name=spec["name"],
                location=spec["location"],
                capacity_tons_per_day=spec["capacity_tons_per_day"],
                status=spec["status"]
            )
            db.add(plant)
            plants_dict[spec["name"]] = (plant, spec["oee_target"])
        
        await db.flush() # Populate IDs

        print("Seeding Production Lines & Machines...")
        machines_list = []
        lines_list = []
        plant_b_id = None
        furnace_2_id = None
        
        for plant_name, (plant, oee_target) in plants_dict.items():
            if "Pune" in plant_name:
                plant_b_id = plant.id
                
            # Seed 5 Production Lines
            for line_name, line_type, cap in LINE_TYPES:
                line = ProductionLine(
                    plant_id=plant.id,
                    name=f"{plant_name.split(' — ')[1]} {line_name}",
                    line_type=line_type,
                    capacity_tons_per_hour=cap,
                    status="running" if "Pune" not in plant_name else random.choice(["running", "running", "idle"])
                )
                db.add(line)
                lines_list.append(line)
                await db.flush()
                
                # Seed 4 Machines per Line (20 per plant, 60 total)
                for idx, (m_name, m_type, mfg) in enumerate(MACHINE_TYPES[:4]):
                    name_code = f"{m_name.replace(' ', '')}-{idx+1}"
                    # Custom health calculation
                    health = random.uniform(85, 98)
                    if "Pune" in plant_name:
                        health -= random.uniform(5, 15)
                        
                    machine = Machine(
                        plant_id=plant.id,
                        line_id=line.id,
                        name=f"{line.name.split(' ')[1]} {name_code}",
                        machine_type=m_type,
                        manufacturer=mfg,
                        installation_date=date.today() - timedelta(days=random.randint(300, 2000)),
                        last_maintenance=date.today() - timedelta(days=random.randint(15, 60)),
                        next_maintenance=date.today() + timedelta(days=random.randint(10, 45)),
                        health_score=health,
                        status="operational" if health > 75 else "degraded"
                    )
                    
                    # Highlight Pune Furnace 2 bearing issue
                    if "Pune" in plant_name and m_type == "furnace" and line_name == "Blast Furnace Line":
                        # Let's override it specifically to represent the failing bearing
                        machine.name = "Pune Furnace-2"
                        machine.health_score = 67.0
                        machine.status = "degraded"
                        machine.next_maintenance = date.today() - timedelta(days=3) # OVERDUE
                        
                    db.add(machine)
                    machines_list.append(machine)
            await db.flush()
            
        print("Seeding Production Records (90 Days)...")
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        # Keep track of seeded Furnace 2 to create sensor readings
        pune_furnace_2 = next(m for m in machines_list if m.name == "Pune Furnace-2")
        furnace_2_id = pune_furnace_2.id

        # Generate daily production records for each line
        curr_date = start_date
        while curr_date <= end_date:
            for line in lines_list:
                plant, target_oee = next(p for p in plants_dict.values() if p[0].id == line.plant_id)
                
                # Base performance factor on shift patterns + date
                # Night shift underperforms, Mondays have maintenance
                # Random fluctuations
                is_monday = curr_date.weekday() == 0
                
                for shift in ["morning", "evening", "night"]:
                    shift_factor = 1.0 if shift == "morning" else (0.96 if shift == "evening" else 0.92)
                    maint_factor = 0.95 if is_monday else 1.0
                    
                    # Plant specific factors
                    plant_factor = 1.0
                    if plant.name == "Plant B — Pune":
                        plant_factor = 0.85
                        # Degrading further in the last 14 days due to Furnace 2 vibration
                        days_diff = (end_date - curr_date).days
                        if days_diff <= 14:
                            plant_factor -= (14 - days_diff) * 0.01
                            
                    actual_oee = target_oee * shift_factor * maint_factor * plant_factor * random.uniform(0.96, 1.04)
                    actual_oee = min(100.0, max(45.0, actual_oee))
                    
                    # Split OEE components
                    avail = min(100.0, actual_oee * random.uniform(1.02, 1.08))
                    perf = min(100.0, actual_oee * random.uniform(1.01, 1.05))
                    qual = min(100.0, actual_oee / ((avail/100.0) * (perf/100.0)))
                    
                    # Target tons and actual calculation
                    capacity_per_shift = line.capacity_tons_per_hour * 8
                    target_tons = capacity_per_shift * 0.85
                    actual_tons = target_tons * (actual_oee / 100.0) * random.uniform(0.98, 1.02)
                    
                    defect_rate = (100.0 - qual) * 0.05
                    defect_tons = actual_tons * (defect_rate / 100.0)
                    scrap_tons = defect_tons * 0.4
                    
                    prod_rec = ProductionRecord(
                        plant_id=line.plant_id,
                        line_id=line.id,
                        shift=shift,
                        date=curr_date,
                        target_tons=target_tons,
                        actual_tons=actual_tons,
                        defect_tons=defect_tons,
                        scrap_tons=scrap_tons,
                        oee_score=actual_oee,
                        availability=avail,
                        performance=perf,
                        quality=qual
                    )
                    db.add(prod_rec)
            curr_date += timedelta(days=1)
        
        print("Seeding Downtime Events...")
        # Add ~10-20 downtime events per plant over 90 days
        curr_date = start_date
        while curr_date <= end_date:
            if random.random() < 0.15: # 15% chance of downtime event on any day
                for plant in plants_dict.values():
                    plant_obj = plant[0]
                    # Select random machine from this plant
                    plant_machines = [m for m in machines_list if m.plant_id == plant_obj.id]
                    if not plant_machines:
                        continue
                    m = random.choice(plant_machines)
                    
                    duration = random.randint(30, 240)
                    started = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=random.randint(1, 20))
                    ended = started + timedelta(minutes=duration)
                    
                    category = random.choice(["mechanical", "electrical", "process", "planned", "external"])
                    impact = (duration / 60) * 15.0 * random.uniform(0.7, 1.2) # Impact in tons
                    
                    # Special long downtime for Furnace 2 in Plant B near end_date
                    if m.id == furnace_2_id and (end_date - curr_date).days < 5:
                        continue # Keep it running for real-time alerts
                        
                    event = DowntimeEvent(
                        machine_id=m.id,
                        plant_id=plant_obj.id,
                        cause_category=category,
                        cause_detail=f"Automated alert: {category.capitalize()} failure detected on {m.name}.",
                        started_at=started,
                        ended_at=ended,
                        duration_minutes=duration,
                        impact_tons=impact,
                        resolution_notes="Maintenance crew dispatched. Recalibrated systems and restarted line."
                    )
                    db.add(event)
            curr_date += timedelta(days=1)

        print("Seeding Maintenance Logs...")
        # Create historical logs
        for m in machines_list:
            # 2-3 logs per machine
            for _ in range(random.randint(1, 3)):
                log_date = datetime.now() - timedelta(days=random.randint(5, 85))
                log = MaintenanceLog(
                    machine_id=m.id,
                    maintenance_type=random.choice(["preventive", "corrective", "predictive"]),
                    technician=random.choice(["Amit Sharma", "Rohan Patil", "Vijay Kumar", "Suresh Naik"]),
                    work_order=f"WO-{random.randint(1000, 9999)}",
                    description=f"Standard check and parts inspection. Greased bearings and updated sensor calibrations.",
                    parts_replaced=["Seal ring", "Lubricant valve"] if random.random() > 0.6 else [],
                    cost_inr=random.uniform(5000, 35000),
                    started_at=log_date - timedelta(hours=3),
                    completed_at=log_date,
                    next_scheduled=log_date + timedelta(days=30)
                )
                db.add(log)
        
        print("Seeding Energy Records (Last 30 Days)...")
        # Hourly energy records
        energy_start = end_date - timedelta(days=30)
        curr_dt = datetime.combine(energy_start, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())
        
        # To avoid generating too many rows in SQLite, seed hourly for key lines
        while curr_dt <= end_dt:
            for line in lines_list:
                # Energy usage spikes between 10am-12pm and 3pm-6pm
                hour = curr_dt.hour
                peak_factor = 1.3 if (10 <= hour <= 12 or 15 <= hour <= 18) else 0.9
                
                # Plant specific efficiency (Plant B consumes more kwh per ton)
                plant, _ = next(p for p in plants_dict.values() if p[0].id == line.plant_id)
                efficiency_factor = 1.18 if "Pune" in plant.name else (0.91 if "Surat" in plant.name else 1.0)
                
                kwh = line.capacity_tons_per_hour * 120 * peak_factor * efficiency_factor * random.uniform(0.9, 1.1)
                cost = kwh * 8.5 * peak_factor  # Cost rate around 8.5 INR/kWh
                
                energy = EnergyRecord(
                    plant_id=line.plant_id,
                    line_id=line.id,
                    recorded_hour=curr_dt,
                    kwh_consumed=kwh,
                    cost_inr=cost,
                    peak_demand_kw=kwh * 0.15,
                    energy_intensity=kwh / max(1.0, line.capacity_tons_per_hour)
                )
                db.add(energy)
            # Increment by 4 hours to keep row count clean but represent daily trends
            curr_dt += timedelta(hours=4)

        print("Seeding Inventory...")
        materials = [
            ("iron_ore", "Grade Fe-62", 12000.0, 3000.0, 6500.0, "NMDC Ltd"),
            ("coal", "Coking Coal Prime", 8000.0, 2000.0, 8500.0, "Coal India"),
            ("limestone", "Flux Grade", 4000.0, 1000.0, 3200.0, "Tata Steel Mining"),
            ("billets", "Grade IS-2062", 2500.0, 500.0, 48000.0, "Internal Production"),
            ("finished_steel", "HRC Coil IS-10748", 5000.0, 1000.0, 56000.0, "Forge Sales")
        ]
        
        for plant_name, (plant, _) in plants_dict.items():
            for mat_type, grade, qty, reorder, cost, supplier in materials:
                # Plant B is low on Iron Ore
                actual_qty = qty * random.uniform(0.7, 1.3)
                if "Pune" in plant_name and mat_type == "iron_ore":
                    actual_qty = reorder * 1.05 # Borderline alert
                    
                inv = Inventory(
                    plant_id=plant.id,
                    material_type=mat_type,
                    material_grade=grade,
                    quantity_tons=actual_qty,
                    reorder_level=reorder,
                    unit_cost_inr=cost,
                    supplier=supplier,
                    last_updated=datetime.now()
                )
                db.add(inv)

        print("Seeding Shipments...")
        # 10 shipments per plant
        for plant_name, (plant, _) in plants_dict.items():
            for idx in range(15):
                is_inbound = idx % 2 == 0
                mat = random.choice(["iron_ore", "coal", "limestone"]) if is_inbound else "finished_steel"
                qty = random.uniform(100, 500)
                status = random.choice(["delivered", "delivered", "in_transit", "scheduled"])
                
                scheduled = date.today() + timedelta(days=random.randint(-15, 10))
                actual = scheduled if status == "delivered" else None
                
                # Active inbound delayed shipment for Floor dashboard
                if "Pune" in plant_name and idx == 0:
                    status = "delayed"
                    mat = "iron_ore"
                    qty = 240
                    scheduled = date.today()
                    actual = None
                
                shipment = Shipment(
                    plant_id=plant.id,
                    shipment_type="inbound" if is_inbound else "outbound",
                    material_type=mat,
                    quantity_tons=qty,
                    origin="Jhagadia Mines" if is_inbound else plant_name.split(" — ")[1],
                    destination=plant_name.split(" — ")[1] if is_inbound else "JSW Infrastructure / Client",
                    carrier=random.choice(["CONCOR", "VRL Logistics", "Adani Logistics"]),
                    scheduled_date=scheduled,
                    actual_date=actual,
                    status=status,
                    delay_reason="Traffic bottlenecks / weather delays at Surat checkpost" if status == "delayed" else None,
                    value_inr=qty * (6500 if is_inbound else 56000)
                )
                db.add(shipment)

        print("Seeding Financial Records (Past 12 Months)...")
        # Generate financial data
        for plant_name, (plant, _) in plants_dict.items():
            for m_offset in range(12):
                month_date = date(date.today().year - 1, date.today().month, 1) + timedelta(days=m_offset * 30)
                # Cap months
                if month_date >= date.today():
                    break
                    
                prod_tons = plant.capacity_tons_per_day * 26 * random.uniform(0.75, 0.95) # 26 working days
                revenue = prod_tons * 58000.0 * random.uniform(0.95, 1.05)
                
                # High energy and maintenance cost in Pune (Plant B)
                energy_cost = revenue * (0.07 if "Pune" in plant_name else 0.05)
                maintenance_cost = revenue * (0.06 if "Pune" in plant_name else 0.03)
                labor_cost = revenue * 0.08
                logistics_cost = revenue * 0.06
                cogs = revenue * 0.65
                
                gross_profit = revenue - cogs
                net_profit = gross_profit - (energy_cost + maintenance_cost + labor_cost + logistics_cost)
                
                fin = FinancialRecord(
                    plant_id=plant.id,
                    month=month_date,
                    revenue_inr=revenue,
                    cost_of_goods_inr=cogs,
                    energy_cost_inr=energy_cost,
                    maintenance_cost_inr=maintenance_cost,
                    labor_cost_inr=labor_cost,
                    logistics_cost_inr=logistics_cost,
                    gross_profit_inr=gross_profit,
                    net_profit_inr=net_profit,
                    tons_produced=prod_tons,
                    tons_sold=prod_tons * 0.97
                )
                db.add(fin)

        print("Seeding Work Orders...")
        # 15 work orders per plant
        for plant_name, (plant, _) in plants_dict.items():
            for idx in range(15):
                wo = WorkOrder(
                    plant_id=plant.id,
                    line_id=random.choice([line.id for line in lines_list if line.plant_id == plant.id]),
                    order_number=f"WO-{1000 + random.randint(1, 8000)}",
                    product_type=random.choice(["HRC Coil", "TMT Rebar", "HR Sheets", "Billets", "Slabs"]),
                    quantity_tons=random.choice([50.0, 80.0, 100.0, 120.0, 150.0, 200.0]),
                    priority=random.choice(["urgent", "high", "normal", "low"]),
                    status=random.choice(["pending", "in_progress", "completed", "completed"]),
                    assigned_team=random.choice(["Team A", "Team B", "Team C", "Shift Crew 1"]),
                    due_date=date.today() + timedelta(days=random.randint(1, 10)),
                    started_at=datetime.now() - timedelta(hours=random.randint(1, 48)) if idx < 5 else None,
                    notes="Quality parameters must comply with BIS standard IS-2062."
                )
                if idx == 0 and "Pune" in plant_name:
                    # Urgent active work order for floor manager dashboard matching spec
                    wo.order_number = "WO-0554"
                    wo.product_type = "HRC Coil"
                    wo.quantity_tons = 80.0
                    wo.priority = "urgent"
                    wo.status = "in_progress"
                    wo.assigned_team = "Team B"
                    wo.due_date = date.today()
                    wo.started_at = datetime.now() - timedelta(hours=3)
                
                db.add(wo)

        print("Seeding Sensor Readings (Last 14 Days)...")
        # To avoid over-inflating DB size while still showing nice sparklines,
        # we will generate 6 readings per day (every 4 hours) for most machines,
        # EXCEPT for "Pune Furnace-2" which we seed with high density readings (every 1 hour)
        # to show the vibration anomaly rising from 2.8 -> 4.2 mm/s.
        
        sensor_start = datetime.now() - timedelta(days=14)
        curr_time = sensor_start
        
        while curr_time <= datetime.now():
            # Seed Furnace-2 vibration & temp with 1-hour intervals
            days_passed = (curr_time - sensor_start).days
            # Vibration increases from 2.8 to 4.2 mm/s over 14 days
            vibe_val = 2.8 + (1.4 * (days_passed / 14.0)) + random.uniform(-0.15, 0.15)
            # Temperature around 1550 with fluctuations
            temp_val = 1520 + (100 * math.sin(curr_time.hour / 24.0 * math.pi)) + random.uniform(-20, 20)
            
            # Record vibration
            db.add(SensorReading(
                machine_id=furnace_2_id,
                sensor_type="vibration",
                value=vibe_val,
                unit="mm/s",
                quality_score=0.98,
                recorded_at=curr_time
            ))
            
            # Record temperature
            db.add(SensorReading(
                machine_id=furnace_2_id,
                sensor_type="temperature",
                value=temp_val,
                unit="°C",
                quality_score=0.99,
                recorded_at=curr_time
            ))
            
            curr_time += timedelta(hours=2) # Keep it 2 hours to be dense enough but lightweight
            
        # Seed sparse sensor readings for other machines
        other_machines = [m for m in machines_list if m.id != furnace_2_id][:15] # limit to 15 key machines
        curr_time = sensor_start
        while curr_time <= datetime.now():
            for m in other_machines:
                # normal vibration ~2.1 mm/s, normal temperature ~1480C
                db.add(SensorReading(
                    machine_id=m.id,
                    sensor_type="vibration",
                    value=2.1 + random.uniform(-0.2, 0.2),
                    unit="mm/s",
                    quality_score=0.97,
                    recorded_at=curr_time
                ))
                if m.machine_type == "furnace":
                    db.add(SensorReading(
                        machine_id=m.id,
                        sensor_type="temperature",
                        value=1480.0 + random.uniform(-50, 50),
                        unit="°C",
                        quality_score=0.98,
                        recorded_at=curr_time
                    ))
            curr_time += timedelta(hours=8) # 8-hour intervals for normal machines

        print("Seeding AI Insights...")
        for plant_name, (plant, _) in plants_dict.items():
            # Summary insight
            db.add(AIInsight(
                plant_id=plant.id,
                insight_type="summary",
                role_target="cxo",
                title=f"Executive Summary — {plant_name.split(' — ')[1]}",
                body=f"Plant production levels are operating at acceptable OEE limits. Energy intensity remains the primary concern with tariff structures rising. Mitigation strategies are focused on shifting high-energy work orders to off-peak periods.",
                severity="info",
                confidence_score=0.95
            ))
            
            if "Pune" in plant_name:
                # Add Furnace 2 bearing anomaly alert matching spec
                db.add(AIInsight(
                    plant_id=plant.id,
                    insight_type="prediction",
                    role_target="technical",
                    title="Furnace 2 — Bearing Failure Risk Detected",
                    body="Vibration readings on Pune Furnace-2 have increased 17% over 14 days, from baseline 2.1 mm/s to 3.8 mm/s today. Pattern matches bearing wear degradation profile. Estimated failure probability: 68% within 10 days. Likely root cause: cooling water flow inconsistency causing thermal stress on bearing housing. Estimated revenue impact if unplanned failure: ₹12.4L.",
                    severity="critical",
                    confidence_score=0.68,
                    data_snapshot={"machine_id": furnace_2_id, "current_value": 3.8, "threshold": 4.0}
                ))
                
                # Shift imbalance opportunity matching spec
                db.add(AIInsight(
                    plant_id=plant.id,
                    insight_type="recommendation",
                    role_target="technical",
                    title="OEE improvement via shift rebalancing",
                    body="Night shift consistently underperforms day shift by 8.3%. Analysis shows the gap is primarily in the Performance factor (tooling setup delays). Suggestion: move senior operator Shift B crew to night rotation to boost performance by estimated +4.2%.",
                    severity="opportunity",
                    confidence_score=0.85
                ))

                # Pace below target alert matching spec
                db.add(AIInsight(
                    plant_id=plant.id,
                    insight_type="alert",
                    role_target="floor",
                    title="Production Pace Below Target",
                    body="Current production pace is 7% below target. At 44 T/hr vs required 48.5 T/hr, Line 3 slowdown is the primary bottleneck. Risk: You may miss today's target by approximately 85 tons.",
                    severity="warning",
                    confidence_score=0.92
                ))

        await db.commit()
        print("Database successfully seeded with 90-day history!")

if __name__ == "__main__":
    asyncio.run(seed())
