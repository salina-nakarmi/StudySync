from datetime import datetime
from .database import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import ForeignKey, func

class Users(Base):
    __tablename__ = 'users'

    user_id:Mapped[int]=mapped_column(primary_key=True)
    username:Mapped[str]= mapped_column(unique=True)
    first_name: Mapped[str]
    last_name: Mapped[str]
    email:Mapped[str]= mapped_column(unique=True)
    phone_no: Mapped[str]
    created_at:Mapped[datetime] = mapped_column(default=func.now())
    updated_at:Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())


class Groups{
    __tablename__ = 'groups'

    id:Mapped[int]=mapped_column(primary_key=True)
    leader_id:Mapped[int]= mapped_column(ForeignKey('users.user_id'))
    group_name:Mapped[str]



}
    



    
 
