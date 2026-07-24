import logging
from typing import List, Dict
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from websockets.exceptions import InvalidState
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_, and_, desc

from .user_service import get_username_by_id
from ..database.models import (
    Messages,
    Replying,
    MessageType,
    DirectMessages,
    DirectMessagesReplying,
    Friends,
    Users
)
from ..schemas.messages import (
    DirectMessageResponse,
    EditingDirectMessageRequest,
    LoadDirectMessageRequest,
    MessageResponse,
    ReplyingDirectMessageRequest,
    StoreDirectMessageRequest,
    StoreMessageRequest,
    ReplyingMessageRequest,
    EditingMessageRequest,
    LoadMessageRequest,
    DeletingMessageRequest
)
from ..services.group_service import get_group_members
from ..services.notification_service import create_notification
from ..schemas.notifications import CreateNotificationRequest

logger = logging.getLogger(__name__)


# =========================
# WEBSOCKET HELPER
# =========================
async def safe_websocket_send(websocket: WebSocket, payload: dict):
    """Helper to prevent WebSocketDisconnect crashes when client closes connection."""
    try:
        await websocket.send_json(payload)
    except (WebSocketDisconnect, InvalidState, RuntimeError):
        # Client disconnected while message was sending
        pass


# =========================
# CONNECTION MANAGERS
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
                pass

    async def broadcast(self, message: Messages, group_id: int):
        payload = {
            "action": "new_message",
            "type": "message",
            "message": {
                "sender_id": message.user_id,
                "group_id": message.group_id,
                "content": message.content,
                "type": str(message.message_type.value if hasattr(message.message_type, "value") else message.message_type),
                "created_at": message.created_at.isoformat() if hasattr(message, "created_at") and message.created_at else datetime.utcnow().isoformat()
            }
        }

        if group_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[group_id]:
                try:
                    await safe_websocket_send(connection, payload)
                except Exception as e:
                    logger.error(f"Error broadcasting to group connection: {e}")
                    dead_connections.append(connection)
            
            for dead in dead_connections:
                self.disconnect(dead, group_id)


class DirectConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"[DirectConnectionManager] Socket registered for user {user_id}")

    async def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"[DirectConnectionManager] Socket disconnected for user {user_id}")

    async def send_to_participants(self, sender_id: str, receiver_id: str, DM: DirectMessages):
        payload = {
            "action": "new_message",
            "type": "message",
            "message": {
                "id": str(getattr(DM, "id", "")),
                "sender_id": DM.sender_id,
                "receiver_id": DM.receiver_id,
                "content": DM.content,
                "type": str(DM.message_type.value if hasattr(DM.message_type, "value") else DM.message_type),
                "created_at": DM.created_at.isoformat() if hasattr(DM, "created_at") and DM.created_at else datetime.utcnow().isoformat()
            }  
        }

        # Dispatch frame to connected participants
        for uid in (sender_id, receiver_id):
            if uid in self.active_connections:
                try:
                    await safe_websocket_send(self.active_connections[uid], payload)
                    logger.info(f"[DirectConnectionManager] Delivered message frame to user {uid}")
                except Exception as e:
                    logger.error(f"[DirectConnectionManager] Error sending frame to user {uid}: {e}")

# Global Module Singleton Instances
connection_manager = ConnectionManager()
direct_connection_manager = DirectConnectionManager()


# =========================
# GROUP MESSAGES
# =========================
async def handle_broadcast(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int,
    mgr: ConnectionManager
):
    try:
        frontend_data = StoreMessageRequest(**data)

        if frontend_data.group_id != group_id:
            await safe_websocket_send(websocket, {"error": "Invalid group context"})
            return

        message = Messages(
            user_id=frontend_data.user_id,
            group_id=frontend_data.group_id,
            content=frontend_data.content,
            message_type=MessageType(frontend_data.type),
            is_reply=False
        )

        session.add(message)
        await session.commit()
        await session.refresh(message)

        await mgr.broadcast(message, group_id)

        members = await get_group_members(group_id, session)
        for member in members:
            if member.user_id != frontend_data.user_id:
                try:
                    await create_notification(
                        CreateNotificationRequest(
                            user_id=member.user_id,
                            username=member.username,
                            title="New Message",
                            message=f"New message in group {group_id}",
                            type="message"
                        ),
                        session
                    )
                except Exception as e:
                    logger.error(f"Error creating notification for user {member.user_id}: {e}")

        await session.commit()

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_broadcast: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to send message", "details": str(e)})


async def handle_history(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
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
                type=str(m.message_type.value if hasattr(m.message_type, "value") else m.message_type)
            )
            for m in reversed(messages)
        ]

        await safe_websocket_send(websocket, {
            "action": "load_history",
            "type": "history",
            "messages": [msg.model_dump() for msg in response_data]
        })

    except Exception as e:
        logger.error(f"Error in handle_history: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to load history"})


async def handle_editing(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
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
            await safe_websocket_send(websocket, {
                "action": "message_edited",
                "message_id": frontend_data.message_id
            })
        else:
            await safe_websocket_send(websocket, {"error": "Message not found or unauthorized"})

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_editing: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to edit message"})


async def handle_replying(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
    try:
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

        await safe_websocket_send(websocket, {
            "action": "reply_sent",
            "message_id": new_message.id
        })

        try:
            replier_name = await get_username_by_id(session, frontend_data.replied_by_id)
            await create_notification(
                CreateNotificationRequest(
                    user_id=frontend_data.replied_to_id,
                    username=replier_name or "System",
                    title="New Reply",
                    message=f"{replier_name or 'Someone'} replied to your message",
                    type="reply"
                ),
                session
            )
            await session.commit()
        except Exception as e:
            logger.error(f"Error creating reply notification: {e}")

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_replying: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to send reply"})


async def handle_deleting(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int
):
    try:
        frontend_data = DeletingMessageRequest(**data)

        await session.execute(
            delete(Replying).where(
                or_(
                    Replying.message_id == frontend_data.delete_message_id,
                    Replying.replied_message_id == frontend_data.delete_message_id
                )
            )
        )

        result = await session.execute(
            delete(Messages).where(
                Messages.id == frontend_data.delete_message_id,
                Messages.user_id == frontend_data.user_id
            )
        )

        await session.commit()

        if result.rowcount > 0:
            await safe_websocket_send(websocket, {
                "action": "message_deleted",
                "message_id": frontend_data.delete_message_id
            })
        else:
            await safe_websocket_send(websocket, {"error": "Message not found or unauthorized"})

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_deleting: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to delete message"})


# ====================================================================================================
# DIRECT MESSAGES
# ====================================================================================================
async def handle_direct_message(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    sender_id: str,
    mgr: DirectConnectionManager
):
    try:
        frontend_data = StoreDirectMessageRequest(**data)

        if frontend_data.sender_id != sender_id:
            await safe_websocket_send(websocket, {"error": "Unauthorized sender ID mismatch"})
            return

        # Enum safety check and conversion
        raw_type = str(frontend_data.type).lower()
        msg_type = MessageType.TEXT
        if hasattr(MessageType, raw_type.upper()):
            msg_type = MessageType[raw_type.upper()]
        elif hasattr(MessageType, raw_type):
            msg_type = MessageType(raw_type)

        direct_message = DirectMessages(
            sender_id=frontend_data.sender_id,
            receiver_id=frontend_data.receiver_id,
            content=frontend_data.content,
            message_type=msg_type,
            is_reply=False
        )

        session.add(direct_message)
        await session.commit()
        await session.refresh(direct_message)

        logger.info(f"Direct message successfully inserted into DB with ID: {direct_message.id}")

        await mgr.send_to_participants(
            frontend_data.sender_id,
            frontend_data.receiver_id,
            direct_message
        )

        user_name = await get_username_by_id(session, frontend_data.sender_id)
        try:
            await create_notification(
                CreateNotificationRequest(
                    user_id=frontend_data.receiver_id,
                    username=user_name,
                    title="New Message",
                    message=f"New message from {user_name}",
                    type="message"
                ),
                session
            )
            await session.commit()
        except Exception as e:
            logger.error(f"Error creating notification for user {frontend_data.receiver_id}: {e}")

    except Exception as e:
        await session.rollback()
        logger.error(f"Failed inside handle_direct_message: {e}", exc_info=True)
        await safe_websocket_send(websocket, {
            "error": "Failed to store or deliver direct message",
            "details": str(e)
        })


async def handle_direct_messages_history(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    sender_id: str
):
    try:
        frontend_data = LoadDirectMessageRequest(**data)

        query = select(DirectMessages).where(
            or_(
                and_(
                    DirectMessages.sender_id == sender_id,
                    DirectMessages.receiver_id == frontend_data.receiver_id
                ),
                and_(
                    DirectMessages.sender_id == frontend_data.receiver_id,
                    DirectMessages.receiver_id == sender_id
                )
            )
        )

        if frontend_data.last_message_id:
            query = query.where(DirectMessages.id < frontend_data.last_message_id)

        query = query.order_by(DirectMessages.created_at.desc()).limit(50)

        result = await session.execute(query)
        messages = result.scalars().all()

        response_data = [
            DirectMessageResponse(
                sender_id=m.sender_id,
                receiver_id=m.receiver_id,
                content=m.content,
                type=str(m.message_type.value if hasattr(m.message_type, "value") else m.message_type)
            )
            for m in reversed(messages)
        ]

        await safe_websocket_send(websocket, {
            "action": "load_history",
            "type": "history",
            "messages": [msg.model_dump() for msg in response_data]
        })

    except Exception as e:
        logger.error(f"Error in handle_direct_messages_history: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to load history"})


async def handle_direct_message_editing(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    sender_id: str
):
    try:
        frontend_data = EditingDirectMessageRequest(**data)

        result = await session.execute(
            update(DirectMessages)
            .where(
                DirectMessages.id == frontend_data.message_id,
                DirectMessages.sender_id == sender_id
            )
            .values(
                content=frontend_data.edited_content,
                message_type=frontend_data.edited_type,
                is_edited=True
            )
        )

        await session.commit()

        if result.rowcount > 0:
            await safe_websocket_send(websocket, {
                "action": "message_edited",
                "message_id": frontend_data.message_id
            })
        else:
            await safe_websocket_send(websocket, {"error": "Message not found or unauthorized"})

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_direct_message_editing: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to edit message"})


async def get_conversations(user_id: str, session: AsyncSession) -> list[dict]:
    friends_result = await session.execute(
        select(Users).join(Friends, Friends.friend_id == Users.user_id)
        .where(Friends.user_id == user_id)
    )
    friends = friends_result.scalars().all()

    conversations = []
    for friend in friends:
        msg_result = await session.execute(
            select(DirectMessages)
            .where(
                or_(
                    and_(DirectMessages.sender_id == user_id, DirectMessages.receiver_id == friend.user_id),
                    and_(DirectMessages.sender_id == friend.user_id, DirectMessages.receiver_id == user_id),
                )
            )
            .order_by(desc(DirectMessages.created_at))
            .limit(1)
        )
        last_msg = msg_result.scalars().first()

        conversations.append({
            "friend_id": friend.user_id,
            "username": friend.username,
            "latest_message_preview": last_msg.content if last_msg else None,
            "latest_message_time": last_msg.created_at if last_msg else None,
        })

    conversations.sort(key=lambda c: c["latest_message_time"] or datetime.min, reverse=True)
    return conversations

    
async def handle_direct_message_replying(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    sender_id: str
):
    try:
        frontend_data = ReplyingDirectMessageRequest(**data)

        new_message = DirectMessages(
            sender_id=frontend_data.replied_by_id,
            receiver_id=frontend_data.receiver_id,
            content=frontend_data.reply_content,
            message_type=frontend_data.reply_content_type,
            is_reply=True
        )

        session.add(new_message)
        await session.flush()

        new_reply = DirectMessagesReplying(
            message_id=new_message.id,
            replied_message_id=frontend_data.replied_message_id,
            replied_to_id=frontend_data.replied_to_id,
            replied_by_id=frontend_data.replied_by_id
        )

        session.add(new_reply)
        await session.commit()

        await safe_websocket_send(websocket, {
            "action": "reply_sent",
            "message_id": new_message.id
        })
        
        user_name = await get_username_by_id(session, frontend_data.replied_by_id)

        try:
            await create_notification(
                CreateNotificationRequest(
                    user_id=frontend_data.replied_to_id,
                    username=user_name,
                    title="New Reply",
                    message=f"{user_name} replied to your message",
                    type="reply"
                ),
                session
            )
            await session.commit()
        except Exception as e:
            logger.error(f"Error creating reply notification: {e}")

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_direct_message_replying: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to send reply"})


async def handle_direct_message_deleting(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    sender_id: str
):
    try:
        frontend_data = DeletingDirectMessageRequest(**data)

        await session.execute(
            delete(DirectMessagesReplying).where(
                or_(
                    DirectMessagesReplying.message_id == frontend_data.delete_message_id,
                    DirectMessagesReplying.replied_message_id == frontend_data.delete_message_id
                )
            )
        )

        result = await session.execute(
            delete(DirectMessages).where(
                DirectMessages.id == frontend_data.delete_message_id,
                DirectMessages.sender_id == sender_id
            )
        )

        await session.commit()

        if result.rowcount > 0:
            await safe_websocket_send(websocket, {
                "action": "message_deleted",
                "message_id": frontend_data.delete_message_id
            })
        else:
            await safe_websocket_send(websocket, {"error": "Message not found or unauthorized"})

    except Exception as e:
        await session.rollback()
        logger.error(f"Error in handle_direct_message_deleting: {e}", exc_info=True)
        await safe_websocket_send(websocket, {"error": "Failed to delete message"})