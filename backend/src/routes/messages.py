from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect

from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..services.user_service import get_user_by_id
from ..services.group_service import get_group_by_id
from ..services.messages_service import ConnectionManager, handle_history, handle_broadcast, handle_typing, handle_editing

from ..database.database import get_db
from ..database.models import Users, Messages, Groups
from ..dependencies import get_current_user



router = APIRouter(prefix="/{user_id}/{group_id}/ws")

connection_manager= ConnectionManager


ROUTES = {
    "load_history":handle_history,
    "send_message":handle_broadcast,
    "typing":handle_typing,
    "edit": handle_edit
}
@router.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket, group_id: str, user_id: str, db=Depends(get_db)):
    await websocket.accept()
    
    while True:

        data = await websocket.receive_json() # the json structure will be  JSON{ "action": str, }
        handler= data.get("action")
        frontend_data = data.get("payload")

        try:
            if handler:
                await response_data = handler(frontend_data, db, websocket)
       

