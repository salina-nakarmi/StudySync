"""
Database initialization script
Run this to create all tables in your PostgreSQL database

Usage (from backend directory): python init_db.py
"""
import asyncio
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

from src.database.database import engine, Base
from src.database.models import (
    Users,
    Groups,
    Groupings,
    GroupInvitations,
    Resources,
    ResourceProgress,
    StudySessions,
    Streaks,
    Messages,
    Replying,
    Notifications
)

async def init_db():
    """Create all database tables"""
    print("🔨 Creating database tables...")
    async with engine.begin() as conn:
        # Drop all tables (use with caution!)
        await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")
    print("\n📋 Tables created:")
    print("   - users")
    print("   - groups")
    print("   - groupings")
    print("   - group_invitations")
    print("   - resources")
    print("   - resource_progress")
    print("   - study_sessions")
    print("   - streaks")
    print("   - messages")
    print("   - notifications")

async def drop_all_tables():
    """Drop all tables - USE WITH CAUTION!"""
    print("⚠️  WARNING: This will delete ALL data!")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("🗑️  All tables dropped!")

if __name__ == "__main__":
    print("Initializing StudySync database...")
    asyncio.run(init_db())