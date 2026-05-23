from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.report_service import report_service
from pydantic import BaseModel

router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportGenerateRequest(BaseModel):
    plant_id: str
    report_type: str  # daily | weekly | monthly

@router.get("")
async def list_reports(db: AsyncSession = Depends(get_db)):
    return await report_service.get_report_list(db)

@router.get("/{report_id}")
async def get_report(report_id: str, plant_id: str = Query(..., description="Active Plant ID"), db: AsyncSession = Depends(get_db)):
    report = await report_service.generate_report_content(db, report_id, plant_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.post("/generate")
async def generate_report(req: ReportGenerateRequest, db: AsyncSession = Depends(get_db)):
    # Simulates background generation
    return {
        "success": True,
        "message": f"Report compilation triggered for {req.report_type} on plant {req.plant_id}.",
        "report_id": f"rep-{req.report_type}-custom"
    }
