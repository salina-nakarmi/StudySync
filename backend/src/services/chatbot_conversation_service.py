from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta
from typing import List, Optional
from ..database.models import ChatConversations, Users
import uuid

class ConversationService:
    """Manages converstaion history for the chatbot"""

    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id

    async def save_message(
            self,
            role: str,
            content: str,
            session_id: Optional[str] = None,
            tokens_used: Optional[int] = None,
            modle_used: Optional[str] = None
    ) -> ChatConversations:
        """Save single message to databse"""
        message = ChatConversations(
            user_id=self.user_id,
            role=role,
            content=content,
            session_id=session_id or str(uuid.uuid4()),
            tokens_used=tokens_used,
            model_used=modle_used
        )

        self.db.add(message)
        await self.db.flush()

        print(f"Saved {role} message: {content[:50]}...")
        return message
        
    async def get_recent_history(
        self,
        limit: int = 10,
        session_id: Optional[str] = None
    ) -> List[dict]:
        """
        Get recent conversation history
        
        Args:
            limit: Maximum number of messages to retrieve (default 10 = 5 exchanges)
            session_id: Optional - filter by session
            
        Returns:
            List of messages in format: [{"role": "user", "content": "..."}]
        """
        query = (
            select(ChatConversations)
            .where(ChatConversations.user_id == self.user_id)
            .where(ChatConversations.is_deleted == False)
        )
        
        # Filter by session if provided
        if session_id:
            query = query.where(ChatConversations.session_id == session_id)
        
        # Get most recent messages
        query = query.order_by(desc(ChatConversations.created_at)).limit(limit)
        
        result = await self.db.execute(query)
        messages = result.scalars().all()
        
        # Convert to chat format (newest first -> oldest first for context)
        history = [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at
            }
            for msg in reversed(messages)  # Reverse to get chronological order
        ]
        
        print(f"📜 Loaded {len(history)} messages from history")
        return history
    
    async def get_or_create_session_id(self, provided_session_id: Optional[str] = None) -> str:
        """
        Get or create session_id with smart logic
        
        Priority:
        1. Use provided session_id if valid and recent
        2. Continue last session if < 1 hour old
        3. Create new session otherwise
        """
        # If frontend provided a session_id, verify it's valid and recent
        if provided_session_id:
            result = await self.db.execute(
                select(ChatConversations)
                .where(ChatConversations.user_id == self.user_id)
                .where(ChatConversations.session_id == provided_session_id)
                .where(ChatConversations.is_deleted == False)
                .order_by(desc(ChatConversations.created_at))
                .limit(1)
            )
            
            session_msg = result.scalars().first()
            
            # If session exists and is recent (< 1 hour), use it
            if session_msg and \
               (datetime.now() - session_msg.created_at) < timedelta(hours=24):
                print(f"♻️ Using provided session: {provided_session_id[:8]}...")
                return provided_session_id
        
        # Otherwise, check for recent activity (any session)
        result = await self.db.execute(
            select(ChatConversations)
            .where(ChatConversations.user_id == self.user_id)
            .where(ChatConversations.is_deleted == False)
            .order_by(desc(ChatConversations.created_at))
            .limit(1)
        )
        
        last_message = result.scalars().first()
        
        # Continue last session if recent (< 1 hour)
        if last_message and \
           (datetime.now() - last_message.created_at) < timedelta(hours=1) and \
           last_message.session_id:
            print(f"♻️ Continuing last session: {last_message.session_id[:8]}...")
            return last_message.session_id
        
        # Create new session
        new_session = str(uuid.uuid4())
        print(f"🆕 Created new session: {new_session[:8]}...")
        return new_session
    
    async def clear_history(self, session_id: Optional[str] = None):
        """
        Soft delete conversation history
        
        Args:
            session_id: Optional - clear specific session, or all if None
        """
        query = (
            select(ChatConversations)
            .where(ChatConversations.user_id == self.user_id)
            .where(ChatConversations.is_deleted == False)
        )
        
        if session_id:
            query = query.where(ChatConversations.session_id == session_id)
        
        result = await self.db.execute(query)
        messages = result.scalars().all()
        
        for msg in messages:
            msg.is_deleted = True
        
        await self.db.flush()
        print(f"🗑️ Cleared {len(messages)} messages")
    
    async def get_conversation_stats(self) -> dict:
        """Get statistics about user's conversations"""
        from sqlalchemy import func
        
        # Total messages
        total_result = await self.db.execute(
            select(func.count(ChatConversations.id))
            .where(ChatConversations.user_id == self.user_id)
            .where(ChatConversations.is_deleted == False)
        )
        total_messages = total_result.scalar() or 0
        
        # Total tokens used
        tokens_result = await self.db.execute(
            select(func.sum(ChatConversations.tokens_used))
            .where(ChatConversations.user_id == self.user_id)
            .where(ChatConversations.is_deleted == False)
        )
        total_tokens = tokens_result.scalar() or 0
        
        return {
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "user_messages": total_messages // 2,  # Approximate
            "assistant_messages": total_messages // 2
        }

        