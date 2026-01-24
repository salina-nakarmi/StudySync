# backend/src/services/chatbot_service.py

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlalchemy.future import select
from datetime import datetime, timedelta
from ..database.models import Users
from ..database.models import Users, Streaks, StudySessions, ResourceProgress, Resources
import os

class ChatbotService:
    def __init__(self, db: AsyncSession, Users: str):
        self.db = db
        self.user_id = Users.user_id if Users else None

        # Initialize Groq client (uses OpenAI-compatible API)
        self.client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )

    async def build_user_context(self) -> dict:
        """Query the Database to get user's actual study data"""
        print(f"📊 Building context for user: {self.user_id}")
        
        # 1. Get user basic info 
        user_result = await self.db.execute(
            select(Users).where(Users.user_id == self.user_id)
        )
        user = user_result.scalar_one_or_none()  # ✨ FIXED

        # 2. Get streak data - ✨ FIX: Same here
        streak_result = await self.db.execute(
            select(Streaks).where(Streaks.user_id == self.user_id)
        )
        streak = streak_result.scalar_one_or_none()  # ✨ FIXED

        # 3. Get this week's study sessions
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)

        sessions_result = await self.db.execute(
            select(StudySessions)
            .where(StudySessions.user_id == self.user_id)
            .where(StudySessions.session_date >= week_ago)
        )
        weekly_sessions = sessions_result.scalars().all()

        # Calculate weekly stats
        total_minutes = sum(s.duration_seconds for s in weekly_sessions) // 60
        session_count = len(weekly_sessions)
        
        # 4. Get today's study time
        today_sessions = [s for s in weekly_sessions if s.session_date == today]
        today_minutes = sum(s.duration_seconds for s in today_sessions) // 60
        
        # 5. Get in-progress resources
        progress_result = await self.db.execute(
            select(ResourceProgress, Resources)
            .join(Resources)
            .where(ResourceProgress.user_id == self.user_id)
            .where(ResourceProgress.status == 'in_progress')
            .limit(5)
        )
        in_progress = progress_result.all()
        
        # 6. Get completed resources this week
        completed_result = await self.db.execute(
            select(func.count(ResourceProgress.id))
            .where(ResourceProgress.user_id == self.user_id)
            .where(ResourceProgress.status == 'completed')
            .where(ResourceProgress.completed_at >= week_ago)
        )
        completed_count = completed_result.scalar() or 0
        # Build context dictionary
        context = {
            "username": user.username if user else "there",  
            "first_name": user.first_name if user else "there",  
            
            # Streak info
            "current_streak": streak.current_streak if streak else 0,
            "longest_streak": streak.longest_streak if streak else 0,
            
            # Weekly activity
            "weekly_study_minutes": total_minutes,
            "weekly_sessions": session_count,
            "completed_this_week": completed_count,
            
            # Today specific
            "today_minutes": today_minutes,
            "studied_today": len(today_sessions) > 0,
            
            # Resources
            "in_progress_count": len(in_progress),
            "in_progress_titles": [item.Resources.title for item in in_progress[:3]],
            
            # Total stats - ✨ FIXED: user not Users
            "total_study_hours": (user.total_study_time // 3600) if user else 0,
        }
        
        print(f"✅ Context built: {context['first_name']} - {context['current_streak']} day streak")
        return context
    
    def _build_system_prompt(self, context: dict) -> str:  # ✨ FIXED: typo in function signature
        """Create personalized system prompt based on user context"""
        prompt = f"""You are a helpful and encouraging study assistant for {context['first_name']}.

CURRENT USER STATUS:
• Name: {context['first_name']}
• Current streak: {context['current_streak']} days (longest: {context['longest_streak']})
• This week: {context['weekly_study_minutes']} minutes across {context['weekly_sessions']} sessions
• Completed {context['completed_this_week']} resources this week
• Today: {context['today_minutes']} minutes studied
• Studied today: {'Yes ✓' if context['studied_today'] else 'Not yet'}
• Total study time: {context['total_study_hours']} hours
"""

        if context['in_progress_count'] > 0:
            prompt += f"\n• Currently working on {context['in_progress_count']} resources:"
            for title in context['in_progress_titles']:
                prompt += f"\n  - {title}"

        prompt += """

Your role:
- Give PERSONALIZED advice based on their ACTUAL data above
- Be encouraging and motivating
- Use their name naturally
- Reference their specific progress, streak, and resources
- Keep responses concise (2-3 sentences usually)
- Use emojis sparingly: 🔥 for streaks, 📚 for study, 🎯 for goals, ✨ for achievements
- If they're doing well, celebrate it! If they need motivation, encourage them!

Examples of good responses:
- "Great week, Alice! You've logged 340 minutes - that's serious dedication! 🔥"
- "Your 12-day streak is impressive! Just 3 more days to beat your record of 15!"
- "I see you're working on Calculus Notes. How's that going?"

Avoid generic responses. Always use their actual data!
"""
        return prompt
    
    async def get_personalized_response(self, user_message: str) -> str:
        """
        Get AI response with user context
        """
        try:
            # Build context from DB
            context = await self.build_user_context()
            
            # Create personalized system prompt
            system_prompt = self._build_system_prompt(context)
            
            # Call Groq API
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",  # ✨ FIXED: Should be "user" not "Users"
                        "content": user_message
                    }
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            # ✨ FIXED: Actually return the response!
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ Error getting personalized response: {e}")
            raise Exception(f"Failed to get response from AI: {str(e)}")

    # Keep the simple version for testing
    async def get_simple_response(self, user_message: str) -> str:
        """
        Simple test: Send message to Groq and get response
        No user context - just testing connectivity
        """
        try:
            # Call Groq API
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful and friendly study assistant. Keep responses concise and encouraging."
                    },
                    {
                        "role": "user",  # ✨ FIXED: Should be "user" not "Users"
                        "content": user_message
                    }
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ Groq API Error: {e}")
            raise Exception(f"Failed to get response from AI: {str(e)}")