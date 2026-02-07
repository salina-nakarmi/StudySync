from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.messages_service import (
    ConnectionManager,
    handle_history,
    handle_broadcast,
    handle_editing,
    handle_deleting,
    handle_replying
)
from ..database.database import get_db

router = APIRouter()

connection_manager = ConnectionManager()

# Route mapping
ROUTES = {
    "load_history": handle_history,
    "send_message": handle_broadcast,
    "edit": handle_editing,
    "reply": handle_replying,
    "delete": handle_deleting
}


@router.websocket("/{user_id}/{group_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for group chat
    
    Expected message format:
    {
        "action": "send_message" | "load_history" | "edit" | "reply" | "delete",
        "payload": { ... action-specific data ... }
    }
    """
    await connection_manager.connect(websocket, group_id)
    print(f"✅ User {user_id} connected to group {group_id}")

    try:
        while True:
            # Receive JSON message from client
            data = await websocket.receive_json()
            
            action = data.get("action")
            payload = data.get("payload", {})

            if not action:
                await websocket.send_json({"error": "No action specified"})
                continue

            # Route to appropriate handler
            if action in ROUTES:
                handler = ROUTES[action]
                
                # Special handling for broadcast to pass connection_manager
                if action == "send_message":
                    await handler(payload, db, websocket, group_id, connection_manager)
                else:
                    await handler(payload, db, websocket, group_id)
            else:
                await websocket.send_json({
                    "error": f"Invalid action: {action}",
                    "available_actions": list(ROUTES.keys())
                })

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, group_id)
        print(f"❌ User {user_id} disconnected from group {group_id}")
    except Exception as e:
        print(f"⚠️ WebSocket error for user {user_id} in group {group_id}: {e}")
        connection_manager.disconnect(websocket, group_id)
        try:
            await websocket.close()
        except:
            pass