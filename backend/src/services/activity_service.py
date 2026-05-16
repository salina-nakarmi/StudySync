from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from ..database.models import DailyActivity
from datetime import date

async def update_daily_stats(db: AsyncSession, user_id: str, duration_seconds: int):
    # 1. Prepare the Upsert
    stmt = insert(DailyActivity).values(
        user_id=user_id,
        activity_date=date.today(),
        total_seconds=duration_seconds,
        session_count=1
    )

    # 2. Add to existing totals if the day already exists
    stmt = stmt.on_conflict_do_update(
        constraint='_user_date_uc',
        set_={
            "total_seconds": DailyActivity.total_seconds + duration_seconds,
            "session_count": DailyActivity.session_count + 1
        }
    )
    
    await db.execute(stmt)
    # No await db.commit() here, we'll do it in the route to keep it atomic
