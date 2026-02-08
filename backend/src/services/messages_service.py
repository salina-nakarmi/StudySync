from typing import List, Dict
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from ..database.models import Messages, Replying, MessageType
from ..schemas.messages import (
    MessageResponse,
    StoreMessageRequest,
    ReplyingMessageRequest,
    EditingMessageRequest,
    LoadMessageRequest,
    DeletingMessageRequest
)
from ..services.group_service import get_group_members
from ..services.notification_service import create_notification
from ..schemas.notifications import CreateNotificationRequest


# =========================
# CONNECTION MANAGER
# =========================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        self.active_connections.setdefault(group_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active_connections:
            try:
                self.active_connections[group_id].remove(websocket)
            except ValueError:
                pass  # WebSocket already removed

    async def broadcast(self, message: Messages, group_id: int):
        """Broadcast message to all connected clients in the group"""
        payload = {
            "action": "new_message",
            "message": {
                "sender_id": message.user_id,
                "group_id": message.group_id,
                "content": message.content,
                "type": str(message.message_type),
            }
        }

        if group_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(payload)
                except Exception as e:
                    print(f"Error broadcasting to connection: {e}")
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                self.disconnect(dead, group_id)


# =========================
# SEND MESSAGE
# =========================
async def handle_broadcast(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int,
    connection_manager: ConnectionManager
):
    """Handle sending a new message to the group"""
    try:
        frontend_data = StoreMessageRequest(**data)

        if frontend_data.group_id != group_id:
            await websocket.send_json({"error": "Invalid group"})
            return

        # Create new message
        message = Messages(
            user_id=frontend_data.user_id,
            group_id=frontend_data.group_id,
            content=frontend_data.content,
            message_type=MessageType(frontend_data.type)
        )

        session.add(message)
        await session.commit()
        await session.refresh(message)

        # Broadcast to all connected clients
        await connection_manager.broadcast(message, group_id)

        # 🔔 Notify other members
        members = await get_group_members(group_id, session)
        for member in members:
            if member.user_id != frontend_data.user_id:
                try:
                    await create_notification(
                        CreateNotificationRequest(
                            user_id=member.user_id,
                            username=member.username,  # Fixed: was members.username
                            title="New Message",
                            message=f"New message in group {group_id}",
                            type="message"
                        ),
                        session
                    )
                except Exception as e:
                    print(f"Error creating notification for user {member.user_id}: {e}")

    except Exception as e:
        print(f"Error in handle_broadcast: {e}")
        await websocket.send_json({"error": "Failed to send message"})


# =========================
# LOAD HISTORY
# =========================
async def handle_history(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
    """Load message history for the group"""
    try:
        frontend_data = LoadMessageRequest(**data)

        query = select(Messages).where(Messages.group_id == group_id)

        if frontend_data.last_message_id:
            query = query.where(Messages.id < frontend_data.last_message_id)

        query = query.order_by(Messages.created_at.desc()).limit(50)

        result = await session.execute(query)
        messages = result.scalars().all()

        response_data = [
            MessageResponse(
                sender_id=m.user_id,
                group_id=m.group_id,
                content=m.content,
                type=m.message_type
            )
            for m in reversed(messages)
        ]

        await websocket.send_json({
            "action": "load_history",
            "history": [msg.model_dump() for msg in response_data]
        })

    except Exception as e:
        print(f"Error in handle_history: {e}")
        await websocket.send_json({"error": "Failed to load history"})


# =========================
# EDIT MESSAGE
# =========================
async def handle_editing(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
    """Handle editing an existing message"""
    try:
        frontend_data = EditingMessageRequest(**data)

        result = await session.execute(
            update(Messages)
            .where(
                Messages.id == frontend_data.message_id,
                Messages.user_id == frontend_data.user_id
            )
            .values(
                content=frontend_data.edited_content,
                message_type=frontend_data.edited_type,
                is_edited=True
            )
        )

        await session.commit()

        if result.rowcount > 0:
            await websocket.send_json({
                "action": "message_edited",
                "message_id": frontend_data.message_id
            })
        else:
            await websocket.send_json({
                "error": "Message not found or unauthorized"
            })

    except Exception as e:
        print(f"Error in handle_editing: {e}")
        await websocket.send_json({"error": "Failed to edit message"})


# =========================
# REPLY TO MESSAGE
# =========================
async def handle_replying(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
    """Handle replying to a message"""
    try:
        frontend_data = ReplyingMessageRequest(**data)

        # Create new reply message
        new_message = Messages(
            user_id=frontend_data.replied_by_id,
            group_id=frontend_data.group_id,
            content=frontend_data.reply_content,
            message_type=frontend_data.reply_content_type,
            is_reply=True
        )

        session.add(new_message)
        await session.flush()

        # Create reply relationship
        new_reply = Replying(
            message_id=new_message.id,
            group_id=frontend_data.group_id,
            replied_message_id=frontend_data.replied_message_id,
            replied_to_id=frontend_data.replied_to_id,
            replied_by_id=frontend_data.replied_by_id
        )

        session.add(new_reply)
        await session.commit()

        await websocket.send_json({
            "action": "reply_sent",
            "message_id": new_message.id
        })

        # 🔔 Notify original sender
        try:
            await create_notification(
                CreateNotificationRequest(
                    user_id=frontend_data.replied_to_id,
                    username="System",  # You may want to fetch the actual username
                    title="New Reply",
                    message="Someone replied to your message",
                    type="reply"
                ),
                session
            )
        except Exception as e:
            print(f"Error creating reply notification: {e}")

    except Exception as e:
        print(f"Error in handle_replying: {e}")
        await websocket.send_json({"error": "Failed to send reply"})


# =========================
# DELETE MESSAGE
# =========================
async def get_is_reply_by_message_id(message_id: int, session: AsyncSession) -> bool:
    """Check if a message is a reply"""
    result = await session.execute(
        select(Messages).where(Messages.id == message_id)
    )
    message = result.scalar_one_or_none()
    return message.is_reply if message else False


async def handle_deleting(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
    """Handle deleting a message"""
    try:
        frontend_data = DeletingMessageRequest(**data)

        is_reply = await get_is_reply_by_message_id(
            frontend_data.delete_message_id,
            session
        )

        # Delete reply relationship if it exists
        if is_reply:
            await session.execute(
                delete(Replying).where(
                    Replying.message_id == frontend_data.delete_message_id
                )
            )

        # Delete the message
        result = await session.execute(
            delete(Messages).where(
                Messages.id == frontend_data.delete_message_id
            )
        )

        await session.commit()

        if result.rowcount > 0:
            await websocket.send_json({
                "action": "message_deleted",
                "message_id": frontend_data.delete_message_id
            })
        else:
            await websocket.send_json({
                "error": "Message not found"
            })

    except Exception as e:
        print(f"Error in handle_deleting: {e}")
        await websocket.send_json({"error": "Failed to delete message"})