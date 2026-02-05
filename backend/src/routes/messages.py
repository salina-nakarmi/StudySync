from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect

from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..services.user_service import get_user_by_id
from ..services.group_service import get_group_by_id
from ..services.messages_service import ConnectionManager, handle_history, handle_broadcast, handle_editing, handle_deleting, handle_replying

from ..database.database import get_db
from ..database.models import Users, Messages, Groups
from ..dependencies import get_current_user



router = APIRouter(prefix="/{user_id}/{group_id}")

connection_manager= ConnectionManager()


ROUTES = {
    "load_history":handle_history,
    "send_message":handle_broadcast,
    "typing":handle_typing,
    "edit": handle_editing,
    "reply":handle_replying,
    "delete":handle_deleting
}
@router.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket, group_id: str, user_id: str, db=Depends(get_db)):
    await websocket.accept()
    

    try:
        while True:
            await connection_manager.connect(websocket,group_id)
            data = await websocket.receive_json() # the json structure will be  JSON{ "action": str, }
            action= data.get("action")
            payload = data.get("payload")

        
        if action in ROUTES:                
              await  ROUTES[action](payload, db, websocket, group_id) 
        else:
                await websocket.send_json({"error": "Invalid action"})

    except WebSocketDisconnect:
            connection_manager.disconnect(websocket, group_id) 
            print(f"User{user_id} disconnected from group {group_id}") 
  
