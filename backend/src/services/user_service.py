'''handles all user_related database operations
    MAIN feature: Creates users automatically on databse on their first request if they don;t exist yet.'''

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.models import Users
from typing import Optional 

async def get_user_by_id(session: AsyncSession, user_id: str) -> Optional[Users]:
    '''get a user form the databse by their clerk user_id
    Args:
        session (AsyncSession): database session
        user_id (str): clerk user id
        
    Returns:
        Users object if found, else None'''
    result = await session.execute(
        select(Users).where(Users.user_id == user_id))
    return result.scalars().first()

async def get_or_create_user(
        session:AsyncSession,
        user_id:str,
        username:str,
        email:str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
        ) -> Users:
        '''
        Get existing user or create new one if doesn't exist 
        try to find user in database if found : return 
        if not : create them using info from clerk and return the new user'''

        user = await get_user_by_id(session, user_id)

        if user:
            return user
        
        new_user = Users(
             user_id = user_id,
             username = username[:50], #enforce max length
             email = email,
             first_name = first_name,
             last_name = last_name,
             total_study_time = 0,
             preferences = None
        )

        #add tp database
        session.add(new_user)
        #flush to get autoggenetaed fields
        await session.flush()

        print(f" Created new user {user_id} in database.")

        return new_user

async def update_user(
          session: AsyncSession,
          user_id: str,
          username: Optional[str] = None,
          email: Optional[str] = None,
          first_name: Optional[str] = None,
          last_name: Optional[str] = None,
          total_study_time: Optional[int] = None,
          preferences: Optional[str] = None
          ) -> Optional[Users]:
    '''Update user information in the database'''
    user = await get_user_by_id(session, user_id)

    if not user:
         return None
    
    #update only the fields that are provided
    if username is not None:
        user.username = username

    if email is not None:       
        user.email = email

    if first_name is not None:  
        user.first_name = first_name

    if last_name is not None:       
        user.last_name = last_name

    if total_study_time is not None:       
        user.total_study_time = total_study_time

    if preferences is not None:
        user.preferences = preferences

    await session.flush()
    return user