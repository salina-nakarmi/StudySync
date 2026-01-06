from typing import List, Optional
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..services.group_service import get_group_members
from ..services.user_service import get_user_by_id
from ..database.models import Messages
from ..schemas.messages import MessageResponse, StoreMessageRequest, LoadMessageRequest , TypingMessageRequest

async def store_message(data: StoreMessageRequest,session: AsyncSession, group_id):
    new_Messages = Messages(
        user_id = data.user_id,
        group_id = data.group_id,
        content = data.content,
        message_type = data.type      
    ) 

    await session.add(new_Messages)
    await session.flush()


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
      
       response=MessageResponse ( 
               sender_id =data.user_id ,
               group_id = data.group_id,
               type = str(data.message_type),
               content = data.content)
       
        await store_message(response:StoreMessageRequest, session , data.group_id)
       
       if data.group_id in self.active_connections: 
           for connection in self.active_connections[data.group_id]:
             await connection.send_json(response.model_dump())
       



async def handle_history(data,session: AsyncSession, websocket:WebSocket, group_id : str):
    last_message_id = data.get("last_message_id")
    query = select(Messages).where(Messages.group_id == group_id)
    if last_message_id:
        if last_message_id < Messages.id:
            query = query.where(Messages.id< last_message_id)
    query = query.order_by(Messages.created_at.asc).limit(50)
    history = await session.execute(query)
    response_data= [MessageResponse(
        sender_id = m.user_id,
        group_id = m.group_id,
        content = m.content,
        type = m.message_type
    )for m in history]

    await websocket.send_json({
        "action": "load_history",
        "history": [msg.model_dump() for msg in response_data]
    })



async def handle_broadcast(data, session: AsyncSession, websocket: WebSocket,group_id):
    data = await data.get("message")

    
async def handle_typing(data, session: AsyncSession, websocket: WebSocket, group_id):




 async def handle_editing(data, session: AsyncSession, websocket: WebSocket, group_id):

   
    
    




