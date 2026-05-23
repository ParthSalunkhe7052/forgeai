from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Plant, AIInsight
from app.services.rules_engine import rules_engine
from app.services.ai_service import ai_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

class SummaryRequest(BaseModel):
    plant_id: str
    role: str

@router.get("/alerts")
async def get_active_alerts(plant_id: str, db: AsyncSession = Depends(get_db)):
    # Run evaluation to make sure alerts are fresh
    await rules_engine.evaluate_rules(db, plant_id)
    
    # Retrieve active alerts
    stmt = select(AIInsight).where(
        AIInsight.plant_id == plant_id,
        AIInsight.insight_type == "alert",
        AIInsight.is_active == True
    ).order_by(AIInsight.generated_at.desc())
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/insights")
async def get_cached_insights(
    plant_id: str, 
    role: str = Query("all", description="cxo, technical, floor, or all"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AIInsight).where(
        AIInsight.plant_id == plant_id,
        AIInsight.insight_type != "alert",
        AIInsight.is_active == True
    )
    if role != "all":
        stmt = stmt.where(AIInsight.role_target.in_([role, "all"]))
        
    stmt = stmt.order_by(AIInsight.generated_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/summary")
async def generate_role_summary(req: SummaryRequest, db: AsyncSession = Depends(get_db)):
    # Fetch plant
    plant_stmt = select(Plant).where(Plant.id == req.plant_id)
    plant = (await db.execute(plant_stmt)).scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    # Generate executive summary via ai_service
    summary_text = await ai_service.generate_summary(plant.name, req.role)
    
    # Check if a summary already exists, update or insert
    existing_stmt = select(AIInsight).where(
        AIInsight.plant_id == req.plant_id,
        AIInsight.insight_type == "summary",
        AIInsight.role_target == req.role,
        AIInsight.is_active == True
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    
    if existing:
        existing.body = summary_text
    else:
        new_insight = AIInsight(
            plant_id=req.plant_id,
            insight_type="summary",
            role_target=req.role,
            title=f"AI Executive Summary ({req.role.upper()})",
            body=summary_text,
            severity="info",
            confidence_score=0.95
        )
        db.add(new_insight)
        
    await db.commit()
    return {"summary": summary_text}
