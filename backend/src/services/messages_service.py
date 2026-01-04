
from typing import List
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.group_service import get_group_members
from ..services.user_service import get_user_by_id
from ..database.models import Messages
from ..schemas.messages import MessageResponse
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List [WebSocket]] = {}

    async def connect(self, websocket:WebSocket, group_id):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id]=[]
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket:WebSocket, group_id):
        self.active_connections[group_id].remove(websocket)

    async def broadcast(self, data: Messages, websocket:WebSocket, session: AsyncSession):
       session.add(data)
       await session.commit()
       await session.refresh(data)
       response=MessageResponse ( 
               sender_id =data.user_id ,
               group_id = data.group_id,
               type = str(data.message_type),
               content = data.content)
       
       if data.group_id in self.active_connections: 
           for connection in self.active_connections[data.group_id]:
             await connection.send_json(response.model_dump())
       




