from datetime import datetime, date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Machine, ProductionRecord, Inventory, Shipment, AIInsight

class RulesEngine:
    async def evaluate_rules(self, db: AsyncSession, plant_id: str):
        alerts = []
        today = date.today()
        
        # 1. Machine Health and Maintenance Rules
        stmt_machines = select(Machine).where(Machine.plant_id == plant_id)
        res_machines = await db.execute(stmt_machines)
        machines = res_machines.scalars().all()
        
        for m in machines:
            # Rule R001: Low Machine Health
            if m.health_score < 70:
                alerts.append({
                    "insight_type": "alert",
                    "role_target": "technical",
                    "title": f"Low Health Score: {m.name}",
                    "body": f"Machine {m.name} health score is degraded at {m.health_score}% — schedule inspection immediately.",
                    "severity": "critical",
                    "confidence_score": 0.90,
                    "data_snapshot": {"machine_id": m.id, "health": m.health_score}
                })
            
            # Rule R003: Overdue Maintenance
            if m.next_maintenance and m.next_maintenance < today:
                days_overdue = (today - m.next_maintenance).days
                alerts.append({
                    "insight_type": "alert",
                    "role_target": "technical",
                    "title": f"Overdue Maintenance: {m.name}",
                    "body": f"{m.name} maintenance scheduled for {m.next_maintenance} is overdue by {days_overdue} days.",
                    "severity": "critical",
                    "confidence_score": 0.99,
                    "data_snapshot": {"machine_id": m.id, "next_maintenance": str(m.next_maintenance)}
                })
                
        # 2. Production Rules (Check last production records)
        stmt_production = select(ProductionRecord).where(
            ProductionRecord.plant_id == plant_id,
            ProductionRecord.date == today
        ).order_by(ProductionRecord.created_at.desc())
        res_prod = await db.execute(stmt_production)
        prod_records = res_prod.scalars().all()
        
        if prod_records:
            total_target = sum(p.target_tons for p in prod_records)
            total_actual = sum(p.actual_tons for p in prod_records)
            total_defects = sum(p.defect_tons for p in prod_records)
            
            # Rule R010: Pace below target (less than 92% of target pace)
            if total_target > 0 and (total_actual / total_target) < 0.92:
                pct = round((total_actual / total_target) * 100.0, 1)
                alerts.append({
                    "insight_type": "alert",
                    "role_target": "floor",
                    "title": "Production Pace Lagging",
                    "body": f"Current shift production pace is at {pct}% of target. Bottlenecks detected.",
                    "severity": "warning",
                    "confidence_score": 0.88,
                    "data_snapshot": {"actual": total_actual, "target": total_target}
                })
                
            # Rule R011: Defect Rate High
            if total_actual > 0 and (total_defects / total_actual) > 0.03:
                defect_pct = round((total_defects / total_actual) * 100.0, 2)
                alerts.append({
                    "insight_type": "alert",
                    "role_target": "floor",
                    "title": "High Quality Defect Rate",
                    "body": f"Quality defects are running high at {defect_pct}% of total tonnage (threshold: 3.0%).",
                    "severity": "warning",
                    "confidence_score": 0.95,
                    "data_snapshot": {"defect_rate": defect_pct}
                })

        # 3. Inventory Rules
        stmt_inv = select(Inventory).where(Inventory.plant_id == plant_id)
        res_inv = await db.execute(stmt_inv)
        inventory_items = res_inv.scalars().all()
        
        for item in inventory_items:
            # Rule R030: Low Inventory
            if item.quantity_tons < item.reorder_level * 1.1:
                runway_hrs = round((item.quantity_tons / (item.reorder_level / 7.0)) * 24.0, 1) if item.reorder_level > 0 else 0
                alerts.append({
                    "insight_type": "alert",
                    "role_target": "floor",
                    "title": f"Low Inventory: {item.material_type.replace('_', ' ').capitalize()}",
                    "body": f"{item.material_type.replace('_', ' ').capitalize()} inventory ({item.quantity_tons} T) is near reorder level. Est. runway: {runway_hrs} hours.",
                    "severity": "warning",
                    "confidence_score": 0.90,
                    "data_snapshot": {"material": item.material_type, "qty": item.quantity_tons}
                })

        # 4. Shipment Rules
        stmt_ship = select(Shipment).where(
            Shipment.plant_id == plant_id,
            Shipment.status == "delayed"
        )
        res_ship = await db.execute(stmt_ship)
        delayed_shipments = res_ship.scalars().all()
        
        for ship in delayed_shipments:
            # Rule R040: Shipment Delayed
            alerts.append({
                "insight_type": "alert",
                "role_target": "floor",
                "title": "Material Shipment Delayed",
                "body": f"Inbound {ship.material_type} shipment of {ship.quantity_tons} T is delayed. Carrier: {ship.carrier}.",
                "severity": "warning",
                "confidence_score": 0.95,
                "data_snapshot": {"carrier": ship.carrier, "qty": ship.quantity_tons}
            })

        # Persist alerts to DB as active AI Insights
        saved_alerts = []
        for alert_data in alerts:
            # Check if this alert is already active
            active_stmt = select(AIInsight).where(
                AIInsight.plant_id == plant_id,
                AIInsight.insight_type == "alert",
                AIInsight.title == alert_data["title"],
                AIInsight.is_active == True
            )
            existing = (await db.execute(active_stmt)).scalar_one_or_none()
            
            if not existing:
                alert = AIInsight(
                    plant_id=plant_id,
                    insight_type=alert_data["insight_type"],
                    role_target=alert_data["role_target"],
                    title=alert_data["title"],
                    body=alert_data["body"],
                    severity=alert_data["severity"],
                    confidence_score=alert_data["confidence_score"],
                    data_snapshot=alert_data["data_snapshot"],
                    is_active=True
                )
                db.add(alert)
                saved_alerts.append(alert_data)
        
        if saved_alerts:
            await db.commit()
            
        return alerts

rules_engine = RulesEngine()
