from typing import List, Dict
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from ..database.models import Messages, Replying
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
            self.active_connections[group_id].remove(websocket)

    async def broadcast(self, message: Messages):
        payload = {
            "action": "new_message",
            "message": {
                "sender_id": message.user_id,
                "group_id": message.group_id,
                "content": message.content,
                "type": str(message.message_type),
            }
        }

        if message.group_id in self.active_connections:
            for connection in self.active_connections[message.group_id]:
                await connection.send_json(payload)


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
    frontend_data = StoreMessageRequest(**data)

    if frontend_data.group_id != group_id:
        await websocket.send_json({"error": "Invalid group"})
        return

    message = Messages(
        user_id=frontend_data.user_id,
        group_id=frontend_data.group_id,
        content=frontend_data.content,
        message_type=frontend_data.type
    )

    session.add(message)
    await session.commit()
    await session.refresh(message)

    await connection_manager.broadcast(message)

    # 🔔 Notify other members
    members = await get_group_members(group_id, session)
    for member in members:
        if member.user_id != frontend_data.user_id:
            await create_notification(
                CreateNotificationRequest(
                    user_id=member.user_id,
                    title="New Message",
                    message=f"New message in group {group_id}",
                    type="message"
                ),
                session
            )


# =========================
# LOAD HISTORY
# =========================
async def handle_history(data, session: AsyncSession, websocket: WebSocket, group_id: int):
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


# =========================
# EDIT MESSAGE
# =========================
async def handle_editing(data, session: AsyncSession, websocket: WebSocket, group_id: int):
    frontend_data = EditingMessageRequest(**data)

    await session.execute(
        update(Messages)
        .where(Messages.id == frontend_data.message_id,
               Messages.user_id == frontend_data.user_id)
        .values(
            content=frontend_data.edited_content,
            message_type=frontend_data.edited_type,
            is_edited=True
        )
    )

    await session.commit()


# =========================
# REPLY TO MESSAGE
# =========================
async def handle_replying(data, session: AsyncSession, websocket: WebSocket, group_id: int):
    frontend_data = ReplyingMessageRequest(**data)

    new_message = Messages(
        user_id=frontend_data.replied_by_id,
        group_id=frontend_data.group_id,
        content=frontend_data.reply_content,
        message_type=frontend_data.reply_content_type,
        is_reply=True
    )

    session.add(new_message)
    await session.flush()

    new_reply = Replying(
        message_id=new_message.id,
        group_id=frontend_data.group_id,
        replied_message_id=frontend_data.replied_message_id,
        replied_to_id=frontend_data.replied_to_id,
        replied_by_id=frontend_data.replied_by_id
    )

    session.add(new_reply)
    await session.commit()

    # 🔔 Notify original sender
    await create_notification(
        CreateNotificationRequest(
            user_id=frontend_data.replied_to_id,
            title="New Reply",
            message="Someone replied to your message",
            type="reply"
        ),
        session
    )


# =========================
# DELETE MESSAGE
# =========================
async def get_is_reply_by_message_id(message_id: int, session: AsyncSession) -> bool:
    result = await session.execute(select(Messages).where(Messages.id == message_id))
    message = result.scalar_one_or_none()
    return message.is_reply if message else False


async def handle_deleting(data, session: AsyncSession, websocket: WebSocket, group_id: int):
    frontend_data = DeletingMessageRequest(**data)

    is_reply = await get_is_reply_by_message_id(frontend_data.delete_message_id, session)

    if is_reply:
        await session.execute(
            delete(Replying).where(Replying.message_id == frontend_data.delete_message_id)
        )

    await session.execute(
        delete(Messages).where(Messages.id == frontend_data.delete_message_id)
    )

    await session.commit()
