from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.messages_service import (
    ConnectionManager,
    DirectConnectionManager,
    handle_direct_message,
    handle_direct_message_deleting,
    handle_direct_message_editing,
    handle_direct_message_replying,
    handle_direct_messages_history,
    handle_history,
    handle_broadcast,
    handle_editing,
    handle_deleting,
    handle_replying,
    get_conversations
)
from ..database.database import get_db

# WebSocket router
router = APIRouter(prefix="/ws", tags=["WebSockets"])

chat_router = APIRouter(prefix="/chat", tags=["Chat"])

connection_manager = ConnectionManager()
direct_connection_manager = DirectConnectionManager()

ROUTES = {
    "load_history": handle_history,
    "send_message": handle_broadcast,
    "edit": handle_editing,
    "reply": handle_replying,
    "delete": handle_deleting
}

DIRECT_ROUTES = {
    "load_history": handle_direct_messages_history,
    "send_message": handle_direct_message,
    "edit": handle_direct_message_editing,
    "reply": handle_direct_message_replying,
    "delete": handle_direct_message_deleting
}


# --- HTTP ENDPOINTS ---
# Resolves to GET /api/chat/conversations
@chat_router.get("/conversations")
async def chat_conversations(
    user_id: str = Query(...), 
    db: AsyncSession = Depends(get_db)
):
    return await get_conversations(user_id, db)


# --- 1. GROUP CHAT WEBSOCKET ENDPOINT ---
@router.websocket("/group/{user_id}/{group_id}")
async def group_websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    await connection_manager.connect(websocket, group_id)
    print(f"✅ User {user_id} connected to group {group_id}")

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            payload = data.get("payload", {})
            if isinstance(payload, dict):
                payload.setdefault("user_id", user_id)

            if not action:
                await websocket.send_json({"error": "No action specified"})
                continue

            if action in ROUTES:
                handler = ROUTES[action]
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
        except Exception:
            pass


# --- 2. DIRECT MESSAGES WEBSOCKET ENDPOINT ---
@router.websocket("/dm/{sender_id}/{receiver_id}")
async def dm_websocket_endpoint(
    websocket: WebSocket,
    sender_id: str,
    receiver_id: str,
    db: AsyncSession = Depends(get_db)
):
    await direct_connection_manager.connect(websocket, sender_id)
    print(f"✅ User {sender_id} connected to DMs with {receiver_id}")

    try:
        await handle_direct_messages_history({"receiver_id": receiver_id, "sender_id": sender_id}, db, websocket, sender_id)

        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            payload = data.get("payload", {})
            if isinstance(payload, dict):
                payload.setdefault("sender_id", sender_id)

            if not action:
                await websocket.send_json({"error": "No action specified"})
                continue

            if action in DIRECT_ROUTES:
                handler = DIRECT_ROUTES[action]
                if action == "send_message":
                    await handler(payload, db, websocket, sender_id, direct_connection_manager)
                else:
                    await handler(payload, db, websocket, sender_id)
            else:
                await websocket.send_json({
                    "error": f"Invalid action: {action}",
                    "available_actions": list(DIRECT_ROUTES.keys())
                })

    except WebSocketDisconnect:
        await direct_connection_manager.disconnect(websocket, sender_id)
        print(f"❌ User {sender_id} disconnected from DMs with {receiver_id}")
    except Exception as e:
        print(f"⚠️ WebSocket error for user {sender_id} with friend {receiver_id}: {e}")
        await direct_connection_manager.disconnect(websocket, sender_id)
        try:
            await websocket.close()
        except Exception:
            pass