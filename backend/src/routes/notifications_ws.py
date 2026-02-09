from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.notification_ws_manager import notification_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])
@router.websocket("/ws/{user_id}")
async def notification_ws(websocket: WebSocket, user_id: str):
    await notification_manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, user_id)
