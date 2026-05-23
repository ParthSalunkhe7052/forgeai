from datetime import datetime, date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np
import math
from app.models import SensorReading, FinancialRecord

class PredictionService:
    async def predict_machine_failure(self, db: AsyncSession, machine_id: str):
        # Fetch the vibration readings for the last 14 days
        cutoff = datetime.utcnow() - timedelta(days=14)
        stmt = select(SensorReading).where(
            SensorReading.machine_id == machine_id,
            SensorReading.sensor_type == "vibration",
            SensorReading.recorded_at >= cutoff
        ).order_by(SensorReading.recorded_at.asc())
        
        result = await db.execute(stmt)
        readings = result.scalars().all()
        
        if not readings or len(readings) < 5:
            # Not enough data for prediction
            return {"days_to_threshold": 30.0, "probability": 0.05}
            
        # Get x (timestamps as float) and y (vibration values)
        x = np.array([(r.recorded_at - readings[0].recorded_at).total_seconds() / 86400.0 for r in readings]) # days
        y = np.array([r.value for r in readings])
        
        # Fit linear regression
        slope, intercept = np.polyfit(x, y, 1)
        
        threshold = 4.0  # mm/s warning threshold
        current_value = y[-1]
        
        if slope <= 0:
            # Vibration is stable or decreasing
            return {"days_to_threshold": 99.0, "probability": 0.01}
            
        days_to_threshold = (threshold - current_value) / slope
        
        # Probability uses a sigmoid curves based on days remaining
        # If days remaining <= 2, probability is high. If days remaining > 20, probability is low.
        probability = 1.0 / (1.0 + math.exp((days_to_threshold - 7.0) * 0.3))
        
        return {
            "days_to_threshold": round(max(0.1, days_to_threshold), 1),
            "probability": round(probability, 2),
            "slope": float(slope),
            "current_value": float(current_value)
        }

    async def forecast_revenue(self, db: AsyncSession, plant_id: str, months_ahead: int = 1):
        # Fetch financial history (last 12 months)
        stmt = select(FinancialRecord).where(
            FinancialRecord.plant_id == plant_id
        ).order_by(FinancialRecord.month.asc())
        
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        if not records:
            return {"forecast": 0.0, "pessimistic": 0.0, "optimistic": 0.0}
            
        history = [r.revenue_inr for r in records]
        
        if len(history) < 3:
            # Default fallback projection if history is short
            base = history[-1]
            return {
                "forecast": base,
                "pessimistic": base * 0.9,
                "optimistic": base * 1.1
            }
            
        # Simple exponential smoothing forecast
        alpha = 0.4
        forecast = history[0]
        for val in history[1:]:
            forecast = alpha * val + (1.0 - alpha) * forecast
            
        # Apply standard deviation bounds
        std_dev = np.std(history)
        
        return {
            "forecast": round(forecast, 2),
            "pessimistic": round(forecast - (std_dev * 0.5), 2),
            "optimistic": round(forecast + (std_dev * 0.5), 2)
        }

prediction_service = PredictionService()
