from typing import List, Optional
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,update,delete

from ..services.group_service import get_group_members
from ..services.user_service import get_user_by_id
from ..database.models import Messages, Replying
from ..schemas.messages import MessageResponse, StoreMessageRequest, ReplyingMessageRequest , EditingMessageRequest,LoadMessageRequest,DeletingMessageRequest

from sqlalchemy.dialects import mysql



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
      
       response=StoreMessageRequest ( 
               sender_id =data.user_id ,
               group_id = data.group_id,
               type = str(data.message_type),
               content = data.content)
       
       await store_message(response, session)
       
       if data.group_id in self.active_connections: 
           for connection in self.active_connections[data.group_id]:
             await connection.send_json(response.model_dump())
       

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import WebSocket

from ..database.models import Messages
from ..schemas.messages import StoreMessageRequest


async def handle_broadcast(
    data: dict,
    session: AsyncSession,
    websocket: WebSocket,
    group_id: int,
    connection_manager
):
    # ✅ 1. Validate incoming payload
    frontend_data = StoreMessageRequest(**data)

    # ✅ 2. Safety check (no group spoofing)
    if frontend_data.group_id != group_id:
        await websocket.send_json({"error": "Invalid group"})
        return

    # ✅ 3. Create Messages object (NOT saved yet)
    message = Messages(
        user_id=frontend_data.user_id,
        group_id=frontend_data.group_id,
        content=frontend_data.content,
        message_type=frontend_data.type
    )

    # ✅ 4. Let ConnectionManager handle storage + broadcast
    await connection_manager.broadcast(message, websocket, session)


async def handle_history(data,session: AsyncSession, websocket:WebSocket, group_id : int):
    frontend_data = LoadMessageRequest(**data)
    last_message_id = frontend_data.last_message_id
    query = select(Messages).where(Messages.group_id == group_id)
    if last_message_id:
            query = query.where(Messages.id< last_message_id)
    query = query.order_by(Messages.created_at.asc).limit(50)
    result = await session.execute(query)
    messages = result.scalars().all()
    response_data= [MessageResponse(
        sender_id = m.user_id,
        group_id = m.group_id,
        content = m.content,
        type = m.message_type
    )for m in messages]

    await websocket.send_json({
        "action": "load_history",
        "history": [msg.model_dump() for msg in response_data]
    })

async def store_message(data: StoreMessageRequest,session: AsyncSession):

    new_Messages = Messages(
        user_id = data.user_id,
        group_id = data.group_id,
        content = data.content,
        message_type = data.type      
    ) 

    session.add(new_Messages)
    await session.flush()
         
      
 

async def handle_editing(data, session: AsyncSession, websocket: WebSocket, group_id):
    frontend_data: EditingMessageRequest = data.get("payload")
    user_id: int = frontend_data.user_id
    message_id: int  = frontend_data.message_id
    group_id: int = frontend_data.group_id
    edited_content: str = frontend_data.edited_content
    edited_type:str = frontend_data.edited_type

    query = update(Messages).where(( Messages.id == message_id) & (Messages.user_id == user_id)).values(content = edited_content, message_type = edited_type, is_edited = True)
    await session.execute(query)
    await session.commit()
    

async def handle_replying(data, session:AsyncSession, websocket: WebSocket,group_id):
    frontend_data:ReplyingMessageRequest = data.get("payload")
    new_message= Messages(
        user_id =frontend_data.replied_by_id,
        group_id = frontend_data.group_id,
        content = frontend_data.content,
        message_type = frontend_data.content_type,
        is_reply = True     
    )  

    session.add(new_message)
    await session.flush()

    new_message_id:int = new_message.id

    new_replying = Replying(
        message_id = new_message_id,
        group_id = frontend_data.group_id,
        replied_message_id = frontend_data.replied_message_id,
        replied_to_id = frontend_data.replied_to_id,
        replied_by_id = frontend_data.replied_by_id       
    )

    session.add(new_replying)
    await session.flush()


async def get_message_by_id(message_id:int, session:AsyncSession):
    query = select(Messages).where(Messages.id == message_id)
    result = await session.execute(query)

async def get_is_reply_by_message_id(message_id:int , session: AsyncSession)->bool:
    query = select(Messages).where(Messages.id == message_id)
    result = await session.execute(query)
    refined_data=  result.scalar().first()
    is_reply:bool = refined_data.is_reply
    return is_reply





async def handle_deleting(data ,session:AsyncSession, websocket: WebSocket, group_id)->bool:
    frontend_data:DeletingMessageRequest = data.get("payload")
    delete_message_id: int = frontend_data.delete_message_id
    user_id:int = frontend_data.user_id
    is_reply:bool = await get_is_reply_by_message_id(delete_message_id,session)
    try: 
      if is_reply:
          
          query = select(Replying).where((Replying.message_id ==delete_message_id)&(Replying.replied_to_id == user_id))
          result_replying= await session.execute(query)
          to_be_deleted_replying = result_replying.scalar().all()
          to_be_deleted_replying_id = to_be_deleted_replying.id
          delete_replying_query = delete(Replying).where(Replying.id == to_be_deleted_replying_id)
          await session.execute(delete_replying_query)
     
      delete_message_query = delete(Messages).where(Messages.id == delete_message_id)
      await session.execute(delete_message_query)
    except:
        print(f"unable to delete the message")







