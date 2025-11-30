# Async SQLAlchemy Setup for PostgreSQL
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncAttrs, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

database_url =os.getenv("DATABASE_URL")

if database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

else:
    raise ValueError("DATABASE_URL environmental Variable is not set")


# Create async engine
engine = create_async_engine(
    database_url, 
    echo=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,
    max_overflow=10
)

class Base(AsyncAttrs, DeclarativeBase):
    pass

# Create async session maker
async_session_local = async_sessionmaker(
    engine, 
    expire_on_commit=False,  # Important for async
    class_=AsyncSession
)

# Dependency function for FastAPI routes
async def get_db():
    """Database session dependency for FastAPI routes"""
    async with async_session_local() as session:
        try:
            yield session
            await session.commit()  # Auto-commit on success
        except Exception:
            await session.rollback()  # Auto-rollback on error
            raise
        finally:
            await session.close()