# StudySync Database Documentation

## Overview
StudySync uses PostgreSQL with async SQLAlchemy ORM. This document describes our database architecture based on the **Three Pillar Tracking System**.

## Quick Start

### Initialize Database
```bash
cd backend
python -m backend.init_db
```

### Use in Code
```python
from backend.src.database.database import get_db
from backend.src.database.models import Users, StudySessions
from sqlalchemy import select

async def example(db: AsyncSession):
    result = await db.execute(select(Users).where(Users.user_id == "user_123"))
    user = result.scalar_one_or_none()
```

---

## Three Pillar Tracking System

Our tracking philosophy focuses on **honest, achievable data** that helps students build habits.

### Pillar 1: Study Sessions
**Automatic time tracking** - Users start/stop a timer, we log duration and date.

**Database**: `study_sessions` table  
**Shows**: Daily/weekly totals, current streak

### Pillar 2: Resource Progress (Self-Tracking)
**Manual progress updates** - Users set their own completion percentage and status.

**Database**: `resource_progress` table  
**Why**: Works for any resource (YouTube, PDFs, external links) without complex tracking

### Pillar 3: Group Accountability
**Social motivation** - Leaderboards showing who studied the most this week.

**Database**: Calculated from `study_sessions` + `streaks` tables  
**Shows**: Weekly rankings, streak counts

---

## Database Tables

### Core Tables

#### **users** - User Profiles
Synced from Clerk authentication.

```sql
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,        -- From Clerk (e.g., "user_2abc123")
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    total_study_time INTEGER DEFAULT 0, -- Cached sum from study_sessions
    preferences TEXT,                    -- JSON string
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Points**:
- `user_id` comes from Clerk, not auto-generated
- `total_study_time` is cached for performance (updated when sessions are logged)
- `preferences` stores user settings as JSON

---

#### **groups** - Study Groups
Organizational units for shared resources and leaderboards.

```sql
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    creator_id VARCHAR REFERENCES users(user_id),
    group_name VARCHAR NOT NULL,
    description TEXT,
    image VARCHAR,
    group_type VARCHAR NOT NULL,        -- 'leader_controlled' or 'community'
    visibility VARCHAR NOT NULL,        -- 'public' or 'private'
    invite_code VARCHAR UNIQUE,
    max_members INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Group Types**:
- `leader_controlled`: Only leaders can add/remove resources
- `community`: All members can contribute

**Visibility**:
- `public`: Anyone can discover and join
- `private`: Requires invitation/invite code

---

#### **groupings** - User-Group Memberships
Many-to-many relationship tracking who belongs to which groups.

```sql
CREATE TABLE groupings (
    user_id VARCHAR REFERENCES users(user_id),
    group_id INTEGER REFERENCES groups(id),
    role VARCHAR NOT NULL,              -- 'leader', 'admin', or 'member'
    invitation_status VARCHAR,          -- 'pending', 'accepted', 'declined'
    invited_by VARCHAR REFERENCES users(user_id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT NOW(),
    is_connected BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);
```

**Roles**:
- `leader`: Full group management (multiple leaders allowed)
- `admin`: Administrative permissions
- `member`: Basic access

---

#### **resources** - Shared Study Materials
Files, folders, or external links shared within groups.

```sql
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    uploaded_by VARCHAR REFERENCES users(user_id),
    group_id INTEGER REFERENCES groups(id),
    url VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,     -- 'image', 'video', 'file', 'folder', 'link'
    title VARCHAR NOT NULL,
    description TEXT,
    parent_folder_id INTEGER REFERENCES resources(id),
    file_size INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Resource Types**:
- `image`, `video`, `file`: Uploaded content
- `folder`: For organizing resources hierarchically
- `link`: External URLs (YouTube, PDFs, articles)

**Folder Structure**: Use `parent_folder_id` to create nested folders

---

#### **resource_progress** - Self-Reported Progress (Pillar 2)
Tracks user's manual progress updates on resources.

```sql
CREATE TABLE resource_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    resource_id INTEGER REFERENCES resources(id),
    status VARCHAR NOT NULL DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed', 'paused'
    progress_percentage INTEGER DEFAULT 0,          -- 0-100
    notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**User Flow**:
1. User finds "Binary Trees Tutorial" in group
2. Drags slider to 60%
3. Sets status to "In Progress"
4. Adds note: "Finished recursion section"
5. Auto-saved in background

**Why Manual?**:
- Works for ANY resource (YouTube, external PDFs, articles)
- Users know better than trackers what they actually learned
- Adds accountability through conscious updates

---

#### **study_sessions** - Study Time Logs (Pillar 1)
Records when users study with a timer.

```sql
CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    group_id INTEGER REFERENCES groups(id),  -- Optional: can study without group
    duration_seconds INTEGER NOT NULL,
    session_date TIMESTAMP NOT NULL,         -- Indexed for leaderboard queries
    session_notes TEXT,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_date ON study_sessions(session_date);
```

**User Flow**:
1. Click "Start Study Session"
2. Select group (optional)
3. Timer runs
4. Click "Stop Session"
5. Add notes (optional): "Worked on binary trees"
6. Session saved

**Example Record**:
```json
{
  "duration_seconds": 3720,
  "group_id": 5,
  "session_date": "2024-12-12T14:30:00",
  "session_notes": "Finished recursion exercises"
}
```

---

#### **streaks** - Daily Study Streaks (Pillar 3)
Tracks consecutive days of studying.

```sql
CREATE TABLE streaks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR UNIQUE REFERENCES users(user_id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date TIMESTAMP,
    streak_start_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Auto-Updated**: When a study session is created, streak recalculates

**Streak Logic**:
- Consecutive days with ≥1 study session
- Breaks if no session for 24+ hours
- Motivates daily consistency

---

### Supporting Tables

#### **group_invitations** - Pending Invites
Manages invitations to private groups.

```sql
CREATE TABLE group_invitations (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    invited_user_id VARCHAR REFERENCES users(user_id),
    invited_by VARCHAR REFERENCES users(user_id),
    status VARCHAR DEFAULT 'pending',
    invitation_message TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP
);
```

---

#### **messages** - Group Chat
Group chat messages (planned feature).

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    group_id INTEGER REFERENCES groups(id),
    content TEXT NOT NULL,
    message_type VARCHAR DEFAULT 'text',  -- 'text' or 'image'
    reply_to_id INTEGER REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### **notifications** - User Notifications
Notification system (planned feature).

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    notification_message VARCHAR NOT NULL,
    notification_type VARCHAR NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Entity Relationships

```
Users ──< Groupings >── Groups
  │                       │
  ├─< StudySessions      └─< Resources
  │                           │
  ├─< ResourceProgress <──────┘
  │
  └── Streaks (1:1)
```

**Key Relationships**:
- **Users ↔ Groups**: Many-to-many via `groupings`
- **Users → StudySessions**: One user, many sessions
- **Groups → Resources**: One group, many resources
- **Users + Resources → ResourceProgress**: Tracks individual progress
- **Users → Streaks**: One-to-one relationship

---

## Enums Reference

All enums are defined in `models.py`:

```python
# Group Management
GroupRole: LEADER, ADMIN, MEMBER
GroupType: LEADER_CONTROLLED, COMMUNITY
GroupVisibility: PUBLIC, PRIVATE
InvitationStatus: PENDING, ACCEPTED, DECLINED

# Resources
ResourceType: IMAGE, VIDEO, FILE, FOLDER, LINK
ResourceStatus: NOT_STARTED, IN_PROGRESS, COMPLETED, PAUSED

# Messages
MessageType: TEXT, IMAGE
```

---

## Common Queries

### Get User's Weekly Study Time
```python
from datetime import datetime, timedelta
from sqlalchemy import select, func

week_ago = datetime.now() - timedelta(days=7)

result = await db.execute(
    select(func.sum(StudySessions.duration_seconds))
    .where(
        StudySessions.user_id == user_id,
        StudySessions.session_date >= week_ago
    )
)
weekly_time = result.scalar() or 0
```

### Get Group Leaderboard
```python
result = await db.execute(
    select(
        Users.username,
        func.sum(StudySessions.duration_seconds).label('total_time'),
        func.max(Streaks.current_streak).label('streak')
    )
    .join(StudySessions, Users.user_id == StudySessions.user_id)
    .join(Streaks, Users.user_id == Streaks.user_id)
    .where(
        StudySessions.group_id == group_id,
        StudySessions.session_date >= week_ago
    )
    .group_by(Users.user_id, Users.username)
    .order_by(func.sum(StudySessions.duration_seconds).desc())
    .limit(10)
)
leaderboard = result.all()
```

### Get User's Progress on Resource
```python
result = await db.execute(
    select(ResourceProgress)
    .where(
        ResourceProgress.user_id == user_id,
        ResourceProgress.resource_id == resource_id
    )
)
progress = result.scalar_one_or_none()

# If no progress record exists, user hasn't started
if not progress:
    progress = {
        "status": "not_started",
        "progress_percentage": 0,
        "notes": None
    }
```

### Update Streak After Study Session
```python
from datetime import date

async def update_streak(user_id: str, session_date: date, db: AsyncSession):
    # Get or create streak
    result = await db.execute(
        select(Streaks).where(Streaks.user_id == user_id)
    )
    streak = result.scalar_one_or_none()
    
    if not streak:
        streak = Streaks(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_active_date=session_date,
            streak_start_date=session_date
        )
        db.add(streak)
        await db.commit()
        return
    
    # Calculate days difference
    if streak.last_active_date:
        days_diff = (session_date - streak.last_active_date.date()).days
        
        if days_diff == 0:
            # Same day - don't update
            return
        elif days_diff == 1:
            # Consecutive day - increment
            streak.current_streak += 1
            streak.longest_streak = max(streak.current_streak, streak.longest_streak)
        else:
            # Streak broken - restart
            streak.current_streak = 1
            streak.streak_start_date = session_date
    
    streak.last_active_date = session_date
    await db.commit()
```

### List User's Groups with Roles
```python
result = await db.execute(
    select(Groups, Groupings.role)
    .join(Groupings, Groups.id == Groupings.group_id)
    .where(Groupings.user_id == user_id)
)
groups = result.all()

for group, role in groups:
    print(f"{group.group_name} - {role}")
```

---

## Best Practices

### 1. Always Use Async/Await
```python
# ✅ Correct
result = await db.execute(select(Users).where(Users.user_id == user_id))
user = result.scalar_one_or_none()

# ❌ Wrong - synchronous query
user = db.query(Users).filter_by(user_id=user_id).first()
```

### 2. Use get_db Dependency in Routes
```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.database.database import get_db

@router.get("/users/me")
async def get_user(db: AsyncSession = Depends(get_db)):
    # db session auto-managed (commits/rollbacks handled)
    result = await db.execute(select(Users).where(...))
    return result.scalar_one()
```

### 3. Update Cached Fields
```python
# When creating study session, update user's total_study_time
session = StudySessions(
    user_id=user_id,
    duration_seconds=3600,
    session_date=datetime.now(),
    ...
)
db.add(session)

# Update cached total
user = await db.get(Users, user_id)
user.total_study_time += session.duration_seconds

await db.commit()
```

### 4. Use Soft Deletes
```python
# ✅ Soft delete
resource.is_deleted = True
await db.commit()

# ❌ Hard delete (avoid)
await db.delete(resource)
```

### 5. Handle Foreign Key Constraints
```python
# Always check parent exists before creating child
group = await db.get(Groups, group_id)
if not group:
    raise HTTPException(404, "Group not found")

# Safe to create resource now
resource = Resources(group_id=group_id, ...)
db.add(resource)
await db.commit()
```

---

## Database Operations

### Create Tables
```bash
python -m backend.init_db
```

### Drop and Recreate (Development Only)
```python
# In a script or init_db.py
from backend.src.database.database import engine
from backend.src.database.models import Base

async def reset_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
```

### Connect to Database
```bash
# Using psql
psql $DATABASE_URL

# List tables
\dt

# Describe table
\d users

# Query
SELECT * FROM users LIMIT 5;
```

---

## Troubleshooting

### "Table does not exist"
```bash
# Tables haven't been created
python -m backend.init_db
```

### Foreign Key Violation
```python
# Ensure parent records exist first
group = await db.get(Groups, group_id)
if not group:
    raise HTTPException(404, "Group not found")
```

### Session Closed Errors
```python
# ❌ Bad: Accessing after session closes
user = await get_user(db)
# session auto-closes here
groups = user.groups  # ERROR!

# ✅ Good: Eager load relationships
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Users)
    .options(selectinload(Users.groups))
    .where(Users.user_id == user_id)
)
user = result.scalar_one()
groups = user.groups  # Works!
```

---

## File Structure

```
backend/src/database/
├── __init__.py           # Package marker
├── database.py           # Engine, SessionLocal, get_db()
├── models.py             # All SQLAlchemy models
└── README.md             # This file
```

---

## Additional Resources

- **Project Context**: See `projectcontext.md` for full architecture
- **API Endpoints**: See `backend/src/routes/` for implementations

---

**Last Updated**: December 12, 2024  
**Database Version**: 2.0