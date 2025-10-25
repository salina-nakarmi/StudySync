import enum
from datetime import datetime
from .database import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import ForeignKey, func, PrimaryKeyConstraint, Boolean, Enum

class GroupRole(enum.Enum):
    MEMBER="member"
    ADMIN= "admin"

class ResourceType(enum.Enum):
    IMAGE="image"
    VIDEO="video"
    FILE="file"
    FOLDER="folder"

class MessageType(enum.Enum):
    IMAGE="image"
    TEXT = "text"


class Users(Base):
    __tablename__ = 'users'

    user_id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    username:Mapped[str]= mapped_column(unique=True)
    first_name: Mapped[str]
    last_name: Mapped[str]
    email:Mapped[str]= mapped_column(unique=True)
    phone_no: Mapped[str]
    created_at:Mapped[datetime] = mapped_column(default=func.now())
    updated_at:Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())


class Groups(Base):
    __tablename__ = 'groups'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    leader_id:Mapped[int]= mapped_column(ForeignKey('users.user_id'))
    group_name:Mapped[str]
    image:Mapped[str]
    description:Mapped[str]
    created_at:Mapped[datetime] = mapped_column(default=func.now())
    updated_at:Mapped[datetime]= mapped_column(default=func.now(), onupdate=func.now())

class Groupings(Base):
    __tablename__='groupings'

    user_id:Mapped[int]= mapped_column(primary_key=True, autoincrement=True)
    group_id:Mapped[int]= mapped_column(ForeignKey('groups.id'))
    roles:Mapped[str]=mapped_column(enum(GroupRole, default=GroupRole.MEMBER))
    joined_at:Mapped[datetime]=mapped_column(default=func.now())
    is_connected:Mapped[datetime]=mapped_column(Boolean,default=False)


class Resources(Base):
    __tablename__='resources'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.user_id'))
    group_id:Mapped[int]=mapped_column(ForeignKey('groups.id'))
    url:Mapped[str]
    type:Mapped[str]=mapped_column(enum(ResourceType, default=None))
    description:Mapped[str]
    created_at:Mapped[datetime]=mapped_column(default=func.now())
    

class Streaks(Base):
    __tablename__='streaks'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.user_id'))
    value:Mapped[int]
    created_at:Mapped[datetime]=mapped_column(default=func.now())
    updated_at:Mapped[datetime]=mapped_column(default=func.now(),updated_at=func.now())


class TimeSpends(Base):
    __tablename__='timespends'

    user_id:Mapped[int]=mapped_column(ForeignKey('users.user_id'))
    group_id:Mapped[int]=mapped_column(ForeignKey('groups.id'))
    duraion_seconds:Mapped[int]
    last_active_date:Mapped[datetime|None]
    started_at:Mapped[datetime]=mapped_column(default=func.now())
    ended_at:Mapped[datetime|None]    
  
    

class Messages(Base):
    __tablename__='messages'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.user_id'))
    group_id:Mapped[int]=mapped_column(ForeignKey('groups.id'))
    content:Mapped[str]
    message_type:Mapped[str]=mapped_column(enum(MessageType, default=MessageType.TEXT))
    created_at:Mapped[datetime]=mapped_column(default=func.now())
    updated_at:Mapped[datetime]=mapped_column(default=func.now(),updated_at=func.now())



class notifications(Base):
    __tablename__ = 'notifications'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.user_id'))
    notification_message:Mapped[str]
    is_read:Mapped[bool]=mapped_column(Boolean, default=False) 
    created_at:Mapped[datetime]=mapped_column(default=func.now())  


    
 
