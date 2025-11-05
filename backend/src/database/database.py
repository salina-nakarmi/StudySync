import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncAttrs, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

database_url =os.getenv("DATABASE_URL")

if database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

else:
    raise ValueError("DATABASE_URL environmental Variable is not set")


engine=create_async_engine(database_url, echo=True)

class Base(AsyncAttrs, DeclarativeBase):
    pass

async_session_local =async_sessionmaker(engine, expire_on_commit=False
)
