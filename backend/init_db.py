
"""
Database initialization script
Run this to create all tables in your PostgreSQL database

Usage:
    python -m backend.init_db
"""
import asyncio
from src.database.database import engine, Base
from src.database.models import (
    Users, Groups, Groupings, Resources, 
    Streaks, TimeSpends, Messages, Notifications
)

async def init_db():
    """Create all database tables"""
    async with engine.begin() as conn:
        # Drop all tables (use with caution!)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")

async def drop_all_tables():
    """Drop all tables - USE WITH CAUTION!"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("⚠️ All tables dropped!")

if __name__ == "__main__":
    print("Initializing database...")
    asyncio.run(init_db())