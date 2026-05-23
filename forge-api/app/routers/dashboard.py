from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models import (
    Plant, Machine, ProductionRecord, DowntimeEvent,
    FinancialRecord, EnergyRecord, Inventory, Shipment, WorkOrder, AIInsight
)
from app.services.analytics import analytics_engine
from app.services.prediction_service import prediction_service
from datetime import date, datetime, timedelta
import random

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/cxo")
async def get_cxo_dashboard(plant_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    # 1. KPIs Row
    # If plant_id is specified, filter, else aggregate all plants
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    
    # Financial aggregate
    fin_stmt = select(
        func.sum(FinancialRecord.revenue_inr).label("revenue"),
        func.sum(FinancialRecord.net_profit_inr).label("net_profit"),
        func.sum(FinancialRecord.energy_cost_inr).label("energy_cost"),
        func.sum(FinancialRecord.tons_produced).label("tons")
    ).where(FinancialRecord.month >= start_of_month)
    
    if plant_id and plant_id != "all":
        fin_stmt = fin_stmt.where(FinancialRecord.plant_id == plant_id)
        
    fin_res = (await db.execute(fin_stmt)).one_or_none()
    
    # Default fallbacks depending on plant_id
    if plant_id and ("pune" in plant_id.lower() or plant_id == "pune-uuid"):
        default_rev = 39000000.0
        default_prof = 7000000.0
        default_energy = 1600000.0
        default_tons = 3800.0
        losses_mtd = 710000.0
    elif plant_id and ("mumbai" in plant_id.lower() or plant_id == "mumbai-uuid"):
        default_rev = 61000000.0
        default_prof = 12000000.0
        default_energy = 2100000.0
        default_tons = 5600.0
        losses_mtd = 820000.0
    elif plant_id and ("surat" in plant_id.lower() or plant_id == "surat-uuid"):
        default_rev = 25000000.0
        default_prof = 5000000.0
        default_energy = 820000.0
        default_tons = 2440.0
        losses_mtd = 330000.0
    else:
        default_rev = 125000000.0
        default_prof = 24000000.0
        default_energy = 4520000.0
        default_tons = 11840.0
        losses_mtd = 1860000.0

    revenue_mtd = fin_res.revenue if fin_res and fin_res.revenue else default_rev
    net_profit_mtd = fin_res.net_profit if fin_res and fin_res.net_profit else default_prof
    energy_cost_mtd = fin_res.energy_cost if fin_res and fin_res.energy_cost else default_energy
    produced_mtd = fin_res.tons if fin_res and fin_res.tons else default_tons
    
    # Plant Utilization
    util_vals = []
    plants_stmt = select(Plant)
    if plant_id and plant_id != "all":
        plants_stmt = plants_stmt.where(Plant.id == plant_id)
    plants = (await db.execute(plants_stmt)).scalars().all()
    for p in plants:
        u = await analytics_engine.calculate_plant_utilization(db, p.id, days=30)
        util_vals.append(u)
    utilization_avg = sum(util_vals) / len(util_vals) if util_vals else (81.5 if plant_id == "pune-uuid" else 84.0)
    
    # 2. Dual-axis Revenue & Profit Trend (12 Months)
    # Query monthly FinancialRecords
    fin_history_stmt = select(FinancialRecord).order_by(FinancialRecord.month.asc())
    if plant_id and plant_id != "all":
        fin_history_stmt = fin_history_stmt.where(FinancialRecord.plant_id == plant_id)
    fin_history = (await db.execute(fin_history_stmt)).scalars().all()
    
    # Group by month
    monthly_data = {}
    for r in fin_history:
        m_str = r.month.strftime("%b")
        if m_str not in monthly_data:
            monthly_data[m_str] = {"revenue": 0.0, "profit": 0.0}
        monthly_data[m_str]["revenue"] += r.revenue_inr
        monthly_data[m_str]["profit"] += r.net_profit_inr
        
    revenue_profit_trend = [
        {"month": m, "revenue": round(data["revenue"] / 10000000.0, 2), "profit": round(data["profit"] / 10000000.0, 2)} # in Crores
        for m, data in monthly_data.items()
    ]
    
    if not revenue_profit_trend:
        # Default mock trend scaled for plants
        months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"]
        scale = default_rev / 125000000.0
        revenue_profit_trend = [
            {
                "month": m, 
                "revenue": round((10.5 + idx * 0.4 + random.uniform(-0.5, 0.5)) * scale, 2), 
                "profit": round((2.0 + idx * 0.1 + random.uniform(-0.2, 0.2)) * scale, 2)
            }
            for idx, m in enumerate(months)
        ]

    # History arrays for mini-sparklines
    rev_hist = [item["revenue"] for item in revenue_profit_trend]
    prof_hist = [item["profit"] for item in revenue_profit_trend]

    # Dynamic Health & Risk calculation
    if plant_id and ("pune" in plant_id.lower() or plant_id == "pune-uuid"):
        health_score = 68
        risk_score = 51
        health_breakdown = {
            "oee": {"weight": 30, "value": 58, "status": "degraded"},
            "finance": {"weight": 30, "value": 75, "status": "amber"},
            "energy": {"weight": 20, "value": 60, "status": "amber"},
            "safety": {"weight": 20, "value": 80, "status": "amber"}
        }
        risk_breakdown = {
            "equipment": {"weight": 40, "value": 68, "status": "critical"},
            "supply": {"weight": 30, "value": 45, "status": "warning"},
            "energy": {"weight": 20, "value": 35, "status": "warning"},
            "safety": {"weight": 10, "value": 30, "status": "warning"}
        }
        savings_value = "₹7.1 Lakhs"
        savings_conf = "88%"
        savings_history = [2.2, 2.5, 2.4, 2.8, 3.2, 3.5, 4.1, 4.8, 5.2, 5.7, 6.8, 7.1]
        savings_delta = "-5.3%"
        top_driver = "Furnace-2 downtime"
        top_concern = "Furnace-2 bearing thermal wear & OEE drop"
        recommended_decision = "Approve automatic preventative replacement & dispatch parts"
    elif plant_id and ("mumbai" in plant_id.lower() or plant_id == "mumbai-uuid"):
        health_score = 84
        risk_score = 23
        health_breakdown = {
            "oee": {"weight": 30, "value": 83, "status": "optimal"},
            "finance": {"weight": 30, "value": 95, "status": "optimal"},
            "energy": {"weight": 20, "value": 82, "status": "optimal"},
            "safety": {"weight": 20, "value": 100, "status": "optimal"}
        }
        risk_breakdown = {
            "equipment": {"weight": 40, "value": 25, "status": "stable"},
            "supply": {"weight": 30, "value": 15, "status": "stable"},
            "energy": {"weight": 20, "value": 35, "status": "warning"},
            "safety": {"weight": 10, "value": 10, "status": "stable"}
        }
        savings_value = "₹8.2 Lakhs"
        savings_conf = "91%"
        savings_history = [7.5, 7.6, 7.8, 7.9, 8.0, 8.1, 8.2, 8.1, 8.2, 8.3, 8.2, 8.2]
        savings_delta = "-3.1%"
        top_driver = "Peak-hour energy tariff"
        top_concern = "Peak-hour energy billing above target threshold"
        recommended_decision = "Reschedule peak arc furnace melting to off-peak slots"
    elif plant_id and ("surat" in plant_id.lower() or plant_id == "surat-uuid"):
        health_score = 94
        risk_score = 10
        health_breakdown = {
            "oee": {"weight": 30, "value": 89, "status": "optimal"},
            "finance": {"weight": 30, "value": 96, "status": "optimal"},
            "energy": {"weight": 20, "value": 92, "status": "optimal"},
            "safety": {"weight": 20, "value": 100, "status": "optimal"}
        }
        risk_breakdown = {
            "equipment": {"weight": 40, "value": 10, "status": "stable"},
            "supply": {"weight": 30, "value": 10, "status": "stable"},
            "energy": {"weight": 20, "value": 15, "status": "stable"},
            "safety": {"weight": 10, "value": 0, "status": "stable"}
        }
        savings_value = "₹3.3 Lakhs"
        savings_conf = "93%"
        savings_history = [2.8, 2.9, 3.0, 3.1, 3.0, 3.2, 3.1, 3.2, 3.3, 3.2, 3.3, 3.3]
        savings_delta = "-1.8%"
        top_driver = "Raw material quality variance"
        top_concern = "Slight raw material stockpile degradation risk"
        recommended_decision = "Recalibrate furnace chemistry inputs for grade Fe-62"
    else:
        health_score = 84
        risk_score = 34
        health_breakdown = {
            "oee": {"weight": 30, "value": 82, "status": "optimal"},
            "finance": {"weight": 30, "value": 95, "status": "optimal"},
            "energy": {"weight": 20, "value": 80, "status": "optimal"},
            "safety": {"weight": 20, "value": 100, "status": "optimal"}
        }
        risk_breakdown = {
            "equipment": {"weight": 40, "value": 34, "status": "stable"},
            "supply": {"weight": 30, "value": 24, "status": "stable"},
            "energy": {"weight": 20, "value": 35, "status": "warning"},
            "safety": {"weight": 10, "value": 15, "status": "stable"}
        }
        savings_value = "₹18.6 Lakhs"
        savings_conf = "87%"
        savings_history = [13.5, 14.0, 14.2, 14.8, 15.4, 15.8, 16.4, 17.1, 17.7, 18.2, 18.5, 18.6]
        savings_delta = "-5.3%"
        top_driver = "Furnace-2 downtime"
        top_concern = "Furnace-2 bearing thermal wear & OEE drop"
        recommended_decision = "Approve automatic preventative replacement & dispatch parts"

    # 3. Loss Sources Donut Chart
    loss_sources = [
        {"name": "Downtime", "value": 42, "cost": round(losses_mtd * 0.42, 2)},
        {"name": "Energy Waste", "value": 28, "cost": round(losses_mtd * 0.28, 2)},
        {"name": "Defects", "value": 30, "cost": round(losses_mtd * 0.30, 2)}
    ]

    # 4. Factory Comparison Grouped Bar Chart
    plant_comparison = []
    all_plants = (await db.execute(select(Plant))).scalars().all()
    for p in all_plants:
        oee_data = await analytics_engine.calculate_oee(db, p.id, days=30)
        util = await analytics_engine.calculate_plant_utilization(db, p.id, days=30)
        
        # MTD revenue estimate
        plant_rev_stmt = select(func.sum(FinancialRecord.revenue_inr)).where(
            FinancialRecord.plant_id == p.id,
            FinancialRecord.month >= start_of_month
        )
        rev = await db.scalar(plant_rev_stmt) or 40000000.0
        
        plant_comparison.append({
            "name": p.name.split(" — ")[1],
            "revenue": round(rev / 10000000.0, 2), # in Cr
            "oee": oee_data["oee"],
            "utilization": util
        })

    # 5. Energy Cost Trend (30 days)
    energy_trend = []
    # Mock daily energy cost for 30 days
    for i in range(30):
        day_date = today - timedelta(days=30-i)
        base_cost = 1.3 if (plant_id and plant_id != "all") else 3.8  # In lakhs
        peak_charge = 0.4 if (day_date.weekday() in [0, 2, 4]) else 0.1 # spike on alternate weekdays
        energy_trend.append({
            "date": day_date.strftime("%d %b"),
            "cost": round(base_cost + peak_charge + random.uniform(-0.2, 0.2), 2),
            "limit": 4.2 if not (plant_id and plant_id != "all") else 1.8
        })

    # 6. Revenue Forecast (30 days)
    forecast_data = []
    history_months = ["Jan", "Feb", "Mar", "Apr", "May"]
    # Historical base
    for idx, m in enumerate(history_months):
        scale = default_rev / 125000000.0
        forecast_data.append({
            "month": m,
            "actual": round((11.2 + idx * 0.3) * scale, 2),
            "forecast": None,
            "pessimistic": None,
            "optimistic": None
        })
    # Forecast forward
    forecast_val = round(12.8 * (default_rev / 125000000.0), 2)
    forecast_data.append({
        "month": "Jun (FC)",
        "actual": None,
        "forecast": forecast_val,
        "pessimistic": round(forecast_val * 0.93, 2),
        "optimistic": round(forecast_val * 1.05, 2)
    })
    
    return {
        "kpis": {
            "revenue": {
                "value": f"₹{round(revenue_mtd / 10000000.0, 1)} Cr", 
                "delta": "+8.2% vs last month" if not (plant_id and "pune" in plant_id.lower()) else "+4.8% vs last month", 
                "trend": "up",
                "history": rev_hist
            },
            "net_profit": {
                "value": f"₹{round(net_profit_mtd / 10000000.0, 1)} Cr", 
                "delta": "+3.1% vs last month" if not (plant_id and "pune" in plant_id.lower()) else "-1.2% vs last month", 
                "margin": f"{round((net_profit_mtd / revenue_mtd) * 100, 1)}%" if revenue_mtd > 0 else "19.2%", 
                "trend": "up" if not (plant_id and "pune" in plant_id.lower()) else "down",
                "history": prof_hist
            },
            "utilization": {"value": f"{round(utilization_avg, 1)}%", "delta": "-2.1% vs last week", "trend": "down"},
            "production": {"value": f"{int(produced_mtd):,} T", "delta": "95.5% of target (12.4k T)" if not (plant_id and "pune" in plant_id.lower()) else "88.2% of target (4.3k T)", "trend": "up"},
            "energy_cost": {"value": f"₹{round(energy_cost_mtd / 100000.0, 1)} L", "delta": "+5.3% vs last month" if not (plant_id and "pune" in plant_id.lower()) else "+18.2% vs last month", "rate": "₹3.82/kWh" if not (plant_id and "pune" in plant_id.lower()) else "₹4.12/kWh", "trend": "down_bad"},
            "losses": {"value": f"₹{round(losses_mtd / 100000.0, 1)} L", "delta": "-12.0% vs last month", "trend": "up_good"},
            "health": {
                "value": health_score,
                "breakdown": health_breakdown
            },
            "risk": {
                "value": risk_score,
                "breakdown": risk_breakdown
            },
            "savings_opportunity": {
                "value": savings_value,
                "confidence": savings_conf,
                "delta": savings_delta,
                "top_driver": top_driver,
                "top_concern": top_concern,
                "recommended_decision": recommended_decision,
                "history": savings_history
            }
        },
        "charts": {
            "revenue_profit_trend": revenue_profit_trend,
            "loss_sources": loss_sources,
            "plant_comparison": plant_comparison,
            "energy_trend": energy_trend,
            "revenue_forecast": forecast_data
        }
    }

@router.get("/technical")
async def get_technical_dashboard(plant_id: str, db: AsyncSession = Depends(get_db)):
    # Requires plant_id
    # 1. KPIs Row
    oee_data = await analytics_engine.calculate_oee(db, plant_id, days=7)
    
    # Downtime this week
    start_of_week = datetime.utcnow() - timedelta(days=7)
    stmt_dt = select(
        func.sum(DowntimeEvent.duration_minutes),
        func.sum(func.case((DowntimeEvent.cause_category == 'planned', DowntimeEvent.duration_minutes), else_=0))
    ).where(
        DowntimeEvent.plant_id == plant_id,
        DowntimeEvent.started_at >= start_of_week
    )
    dt_res = (await db.execute(stmt_dt)).one_or_none()
    total_dt_mins = dt_res[0] if dt_res and dt_res[0] else 142 * 60
    planned_dt_mins = dt_res[1] if dt_res and dt_res[1] else 40 * 60
    unplanned_dt_mins = total_dt_mins - planned_dt_mins
    
    # MTBF & MTTR averages across all machines in plant
    stmt_machines = select(Machine).where(Machine.plant_id == plant_id)
    machines = (await db.execute(stmt_machines)).scalars().all()
    
    mtbf_vals = []
    mttr_vals = []
    for m in machines[:5]: # Take key machines for speed
        mtbf_vals.append(await analytics_engine.calculate_mtbf(db, m.id, days=30))
        mttr_vals.append(await analytics_engine.calculate_mttr(db, m.id, days=30))
        
    avg_mtbf = sum(mtbf_vals) / len(mtbf_vals) if mtbf_vals else 218.0
    avg_mttr = sum(mttr_vals) / len(mttr_vals) if mttr_vals else 4.2
    
    # Open incidents count
    stmt_inc = select(func.count(AIInsight.id)).where(
        AIInsight.plant_id == plant_id,
        AIInsight.insight_type == "alert",
        AIInsight.is_active == True
    )
    incidents = await db.scalar(stmt_inc) or 7
    
    # 2. Charts Row 1: OEE Trend (30 Days)
    oee_trend = []
    for i in range(30):
        day_date = date.today() - timedelta(days=30-i)
        oee_val = oee_data["oee"] + random.uniform(-2.5, 2.5)
        # Pune plant has a downward trend in the last 14 days
        if "pune" in plant_id.lower() or "degraded" in plant_id.lower():
            if i >= 16:
                oee_val -= (i - 16) * 0.4
        oee_val = min(100.0, max(45.0, oee_val))
        
        oee_trend.append({
            "date": day_date.strftime("%d %b"),
            "oee": round(oee_val, 1),
            "availability": round(oee_val * random.uniform(1.02, 1.05), 1),
            "performance": round(oee_val * random.uniform(1.01, 1.03), 1),
            "quality": round(oee_val * random.uniform(1.04, 1.08), 1),
            "target": 80.0
        })

    # 3. Downtime by Machine (Horizontal Bar)
    downtime_by_machine = []
    for m in machines[:6]:
        downtime_by_machine.append({
            "name": m.name.split(" ")[-1],
            "unplanned": random.randint(5, 30) if m.name != "Pune Furnace-2" else 84,
            "planned": random.randint(10, 20)
        })
    downtime_by_machine.sort(key=lambda x: x["unplanned"] + x["planned"], reverse=True)

    # 4. Sensor availability grid heatmap (last 14 days)
    # We will generate a list of machines and their daily status for the last 14 days
    sensor_heatmap = []
    days_list = [date.today() - timedelta(days=d) for d in range(14)]
    days_list.reverse()
    
    for m in machines[:6]:
        readings_status = []
        for d in days_list:
            # Pune Furnace 2 vibration alert on last 3 days
            status = "green"
            if m.name == "Pune Furnace-2" and (date.today() - d).days <= 3:
                status = "red"
            elif m.name == "Pune Furnace-2" and (date.today() - d).days <= 7:
                status = "amber"
            elif random.random() < 0.05:
                status = random.choice(["amber", "red"])
                
            readings_status.append({
                "day": d.strftime("%m-%d"),
                "status": status
            })
            
        sensor_heatmap.append({
            "machine": m.name.split(" ")[-1],
            "history": readings_status
        })

    # 5. Equipment Health Score Table
    equipment_health = []
    for m in machines:
        trend = "up" if m.health_score > 85 else "down"
        equipment_health.append({
            "id": m.id,
            "name": m.name,
            "type": m.machine_type.capitalize(),
            "health": int(m.health_score),
            "status": m.status.upper(),
            "trend": trend,
            "next_maintenance": m.next_maintenance.strftime("%Y-%m-%d") if m.next_maintenance else "N/A"
        })

    # 6. Network & PLC status grid
    plcs = [
        {"name": "PLC-Furnace-Core", "status": "online", "latency": "14ms", "packet_loss": "0.0%"},
        {"name": "PLC-Casting-Feed", "status": "online", "latency": "18ms", "packet_loss": "0.1%"},
        {"name": "PLC-Rolling-Speed", "status": "online", "latency": "22ms", "packet_loss": "0.0%"},
        {"name": "PLC-Cooling-Valve", "status": "degraded" if "pune" in plant_id.lower() else "online", "latency": "120ms" if "pune" in plant_id.lower() else "15ms", "packet_loss": "1.2%" if "pune" in plant_id.lower() else "0.0%"}
    ]

    return {
        "kpis": {
            "oee": {"value": f"{round(oee_data['oee'], 1)}%", "breakdown": f"A:{round(oee_data['availability'], 0)}% | P:{round(oee_data['performance'], 0)}% | Q:{round(oee_data['quality'], 0)}%", "delta": "-3.2% this week", "trend": "down"},
            "downtime": {"value": f"{int(total_dt_mins/60)} hrs", "breakdown": f"Planned: {int(planned_dt_mins/60)}h | Unplanned: {int(unplanned_dt_mins/60)}h", "delta": "+18 hrs vs last week", "trend": "down_bad"},
            "mtbf": {"value": f"{int(avg_mtbf)} hrs", "delta": "-12 hrs vs last month", "trend": "down"},
            "mttr": {"value": f"{avg_mttr} hrs", "delta": "+0.8 hrs vs last month", "trend": "down_bad"},
            "sensor_health": {"value": "94.2%", "breakdown": "3 offline | 2 degraded" if "pune" in plant_id.lower() else "0 offline | 1 degraded", "trend": "down" if "pune" in plant_id.lower() else "stable"},
            "incidents": {"value": str(incidents), "breakdown": f"Critical: 2 | Warning: {incidents - 2}" if incidents > 2 else "Critical: 0 | Warning: 1", "delta": "+3 vs yesterday", "trend": "down_bad"}
        },
        "charts": {
            "oee_trend": oee_trend,
            "downtime_by_machine": downtime_by_machine,
            "sensor_heatmap": sensor_heatmap,
            "equipment_health": equipment_health,
            "plcs": plcs
        }
    }

@router.get("/floor")
async def get_floor_dashboard(plant_id: str, db: AsyncSession = Depends(get_db)):
    # 1. KPIs Row (Shift specific)
    today = date.today()
    
    # Get active shift production records
    prod_stmt = select(ProductionRecord).where(
        ProductionRecord.plant_id == plant_id,
        ProductionRecord.date == today
    )
    prod_records = (await db.execute(prod_stmt)).scalars().all()
    
    produced_today = sum(p.actual_tons for p in prod_records) if prod_records else 387.0
    target_today = sum(p.target_tons for p in prod_records) if prod_records else 620.0
    defect_today = sum(p.defect_tons for p in prod_records) if prod_records else 8.1
    defect_rate = (defect_today / produced_today * 100.0) if produced_today > 0 else 2.1
    
    remaining = max(0.0, target_today - produced_today)
    required_pace = remaining / 8.0 if remaining > 0 else 0.0 # 8 hours remaining
    
    # Material Shipment lists
    ship_in_stmt = select(func.count(Shipment.id)).where(
        Shipment.plant_id == plant_id,
        Shipment.shipment_type == "inbound",
        Shipment.scheduled_date == today
    )
    inbound_count = await db.scalar(ship_in_stmt) or 3
    
    ship_out_stmt = select(func.count(Shipment.id)).where(
        Shipment.plant_id == plant_id,
        Shipment.shipment_type == "outbound",
        Shipment.scheduled_date == today
    )
    outbound_count = await db.scalar(ship_out_stmt) or 2

    # 2. Production Progress Timeline
    timeline = {
        "shift_hours": 8,
        "hours_completed": 4.5,
        "actual_tons": round(produced_today, 1),
        "target_tons": round(target_today, 1),
        "pace_projection": round(produced_today * 1.08, 1), # Projecting slight pace increase
        "downtime_blocks": [
            {"start_hour": 1.5, "duration_hours": 0.5, "type": "break"},
            {"start_hour": 3.0, "duration_hours": 0.75, "type": "mechanical", "label": "Line 3 Jam"}
        ]
    }

    # 3. Factory Floor Map Nodes (Status layout representation)
    floor_nodes = [
        {"id": "node-bf1", "name": "BF-1", "type": "furnace", "status": "operational", "health": 94, "output": "32 T/hr"},
        {"id": "node-bf2", "name": "BF-2", "type": "furnace", "status": "degraded" if "pune" in plant_id.lower() else "operational", "health": 67 if "pune" in plant_id.lower() else 92, "output": "18 T/hr"},
        {"id": "node-eaf1", "name": "EAF-1", "type": "furnace", "status": "operational", "health": 91, "output": "28 T/hr"},
        {"id": "node-line1", "name": "Line 1", "type": "line", "status": "operational", "health": 95, "output": "45 T/hr"},
        {"id": "node-line2", "name": "Line 2", "type": "line", "status": "operational", "health": 92, "output": "40 T/hr"},
        {"id": "node-line3", "name": "Line 3", "type": "line", "status": "critical" if "pune" in plant_id.lower() else "operational", "health": 55 if "pune" in plant_id.lower() else 89, "output": "15 T/hr"},
        {"id": "node-crane-a", "name": "Crane A", "type": "crane", "status": "operational", "health": 88, "output": "Active"},
        {"id": "node-crane-b", "name": "Crane B", "type": "crane", "status": "operational", "health": 90, "output": "Active"},
    ]

    # 4. Live Work Orders
    wo_stmt = select(WorkOrder).where(
        WorkOrder.plant_id == plant_id,
        WorkOrder.status.in_(["in_progress", "pending"])
    ).order_by(WorkOrder.priority.desc())
    wos = (await db.execute(wo_stmt)).scalars().all()
    
    work_orders = []
    for wo in wos:
        work_orders.append({
            "order_number": wo.order_number,
            "product_type": wo.product_type,
            "quantity_tons": int(wo.quantity_tons),
            "priority": wo.priority.upper(),
            "status": wo.status.upper(),
            "assigned_team": wo.assigned_team
        })
        
    if not work_orders:
        work_orders = [
            {"order_number": "WO-0554", "product_type": "HRC Coil", "quantity_tons": 80, "priority": "URGENT", "status": "IN PROGRESS", "assigned_team": "Team B"},
            {"order_number": "WO-0551", "product_type": "TMT Rebar", "quantity_tons": 120, "priority": "HIGH", "status": "IN PROGRESS", "assigned_team": "Team A"},
            {"order_number": "WO-0548", "product_type": "Billets", "quantity_tons": 50, "priority": "NORMAL", "status": "QUEUED", "assigned_team": "Team C"},
        ]

    # 5. Shipment Schedule
    ship_stmt = select(Shipment).where(
        Shipment.plant_id == plant_id,
        Shipment.scheduled_date == today
    )
    ships = (await db.execute(ship_stmt)).scalars().all()
    
    shipment_schedule = []
    for s in ships:
        shipment_schedule.append({
            "type": s.shipment_type.upper(),
            "material": s.material_type.replace('_', ' ').capitalize(),
            "quantity": f"{int(s.quantity_tons)}T",
            "eta": "02:30 PM" if s.status == "delayed" else "04:00 PM",
            "status": s.status.upper()
        })
        
    if not shipment_schedule:
        shipment_schedule = [
            {"type": "INBOUND", "material": "Iron Ore", "quantity": "240T", "eta": "2:30 PM", "status": "DELAYED" if "pune" in plant_id.lower() else "ON TRACK"},
            {"type": "INBOUND", "material": "Limestone", "quantity": "45T", "eta": "5:00 PM", "status": "ON TRACK"},
            {"type": "OUTBOUND", "material": "HRC Coils", "quantity": "180T", "eta": "4:00 PM", "status": "READY"},
        ]

    # 6. Material Inventory Stocks
    inv_stmt = select(Inventory).where(Inventory.plant_id == plant_id)
    invs = (await db.execute(inv_stmt)).scalars().all()
    
    inventory_stocks = []
    for iv in invs:
        # Calculate percentage vs reorder level
        pct = (iv.quantity_tons / (iv.reorder_level * 2)) * 100.0
        pct = min(100.0, max(5.0, pct))
        inventory_stocks.append({
            "material": iv.material_type.replace('_', ' ').capitalize(),
            "level": int(iv.quantity_tons),
            "reorder": int(iv.reorder_level),
            "pct": int(pct),
            "status": "alert" if iv.quantity_tons < iv.reorder_level * 1.1 else "normal"
        })

    return {
        "kpis": {
            "target": {"value": f"{int(target_today)} T", "sub": "Morning Shift"},
            "produced": {"value": f"{int(produced_today)} T", "pct": int((produced_today/target_today)*100.0) if target_today > 0 else 62, "sub": "Current shift duration"},
            "remaining": {"value": f"{int(remaining)} T", "sub": f"Required pace: {round(required_pace, 1)} T/hr", "status": "warning" if "pune" in plant_id.lower() else "normal"},
            "defect_rate": {"value": f"{round(defect_rate, 1)}%", "sub": f"{round(defect_today, 1)} T rejected today", "status": "critical" if defect_rate > 2.0 else "normal"},
            "inbound": {"value": f"{inbound_count} shipments", "sub": "Next: Iron Ore 240T", "status": "warning" if "pune" in plant_id.lower() else "normal"},
            "outbound": {"value": f"{outbound_count} loads", "sub": "Next: 4:00 PM (JSW)", "status": "normal"}
        },
        "widgets": {
            "timeline": timeline,
            "floor_map": floor_nodes,
            "work_orders": work_orders,
            "shipments": shipment_schedule,
            "inventory": inventory_stocks
        }
    }
