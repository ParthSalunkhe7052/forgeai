from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app.routers.dashboard import get_cxo_dashboard, get_technical_dashboard, get_floor_dashboard
import asyncio
import json
from datetime import datetime

router = APIRouter(tags=["WebSockets"])

# Simple dependency bypass for WebSocket since standard Depends doesn't work out-of-the-box inside connection loops
async def get_websocket_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

@router.websocket("/ws/live/{plant_id}")
async def websocket_endpoint(websocket: WebSocket, plant_id: str, role: str = "cxo"):
    await websocket.accept()
    print(f"WebSocket client connected: Plant {plant_id}, Role {role}")
    
    try:
        # Keep track of connection
        while True:
            # 1. Gather fresh data based on role
            async with SessionLocal() as db:
                if role == "cxo":
                    data = await get_cxo_dashboard(plant_id=plant_id if plant_id != "all" else None, db=db)
                elif role == "technical":
                    data = await get_technical_dashboard(plant_id=plant_id, db=db)
                else:
                    data = await get_floor_dashboard(plant_id=plant_id, db=db)
                    
            # 2. Push update payload
            update_payload = {
                "type": "metrics_update",
                "timestamp": datetime.utcnow().isoformat() if 'datetime' in globals() else asyncio.subprocess.time.time(),
                "data": data
            }
            
            await websocket.send_text(json.dumps(update_payload))
            
            # Wait 30 seconds before sending next tick
            # We use a short sleep with check to detect quick client disconnection
            for _ in range(30):
                await asyncio.sleep(1)
                
    except WebSocketDisconnect:
        print(f"WebSocket client disconnected: Plant {plant_id}")
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        try:
            await websocket.close()
        except:
            pass
