from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import ChatMessage, Plant
from app.services.ai_service import ai_service
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatMessageRequest(BaseModel):
    session_id: str
    content: str
    role_context: str  # cxo | technical | floor
    plant_id: Optional[str] = None

@router.get("/sessions/{session_id}/history")
async def get_chat_history(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatMessage).where(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc())
    
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at
        }
        for m in messages
    ]

@router.post("/message")
async def send_chat_message(req: ChatMessageRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch Plant context if available
    plant_name = "All Plants"
    if req.plant_id:
        plant_stmt = select(Plant).where(Plant.id == req.plant_id)
        plant = (await db.execute(plant_stmt)).scalar_one_or_none()
        if plant:
            plant_name = plant.name
            
    # 2. Save User Message
    user_msg = ChatMessage(
        session_id=req.session_id,
        role="user",
        content=req.content,
        role_context=req.role_context,
        plant_id=req.plant_id
    )
    db.add(user_msg)
    await db.commit()
    
    # 3. Stream Response
    async def response_generator():
        accumulated_text = ""
        try:
            async for chunk in ai_service.stream_chat(req.content, plant_name, req.role_context):
                accumulated_text += chunk
                yield chunk
                
            # Once stream is done, write assistant message to DB
            async with AsyncSession(db.bind, expire_on_commit=False) as write_db:
                assistant_msg = ChatMessage(
                    session_id=req.session_id,
                    role="assistant",
                    content=accumulated_text,
                    role_context=req.role_context,
                    plant_id=req.plant_id
                )
                write_db.add(assistant_msg)
                await write_db.commit()
        except Exception as e:
            print(f"Error in streaming generation: {e}")
            yield "\n[Error generating response. Please check server logs.]"

    return StreamingResponse(response_generator(), media_type="text/plain")
