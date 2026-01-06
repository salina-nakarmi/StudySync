from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect

from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..services.user_service import get_user_by_id
from ..services.group_service import get_group_by_id
from ..services.messages_service import ConnectionManager

from ..database.database import get_db
from ..database.models import Users, Messages, Groups
from ..dependencies import get_current_user



router = APIRouter(prefix="/{user_id}/{group_id}/ws")

connection_manager= ConnectionManager



@router.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket, group_id: str, user_id: str):
    await websocket.accept()

    
   
    while True:
        data = await websocket.receive_json()
        await connection_manager.broadcast(data)