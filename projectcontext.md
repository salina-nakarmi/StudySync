# Project Context: StudySync

## Overview
StudySync is a collaborative learning platform that helps students build consistent study habits through gamification, resource sharing, and progress tracking. It bridges the gap between individual learning and collaborative study by providing tools for both personal accountability and group engagement.

## Target Users
- **Students struggling with study consistency**: Those who want to develop regular study habits but lack accountability
- **Collaborative learners**: Students who thrive in group study environments and want to share resources within friend circles or learning communities
- **Self-directed learners**: Individuals who prefer structured, tracked learning but want the option to keep resources private
- **Competitive learners**: Students motivated by leaderboards and streak-based gamification

## Core Features

### 1. Authentication & User Management
- **Clerk Integration**: Secure authentication with email/password and OAuth (Google, GitHub, etc.)
- **Lazy User Creation**: Users automatically added to database on first API request (no webhooks needed)
- **User Profiles**: Track username, email, first/last name, total study time, and preferences
- **Session Management**: JWT token validation on every API request
- **Profile Updates**: Users can update username, name, and preferences

### 2. Groups & Resource Sharing
- **Group Types**:
  - **Leader-Controlled**: Only leaders can manage resources
  - **Community**: All members can contribute resources
  
- **Group Visibility**:
  - **Private Groups**: Invitation-only with invite codes
  - **Public Groups**: Open for anyone to discover and join
  
- **Group Roles**:
  - **Leader**: Full group management (multiple leaders supported)
  - **Admin**: Administrative permissions
  - **Member**: Basic access to group resources

- **Resource Management**:
  - Upload and organize study materials (images, videos, files, folders)
  - Folder hierarchy with parent-child relationships
  - Permission-based CRUD operations

### 3. Time Tracking & Progress
- **Session Tracking**: Real-time study timer with circular progress indicator
- **Time Logging**: Records duration, session date, start/end times
- **Analytics**: Weekly/monthly charts (planned)
- **Personal Dashboard**: Overview of study patterns and user info

### 4. Gamification
- **Streak System**:
  - Current streak counter (consecutive days studied)
  - Longest streak achievement
  - Automatic daily updates
  - Visual calendar integration

- **Leaderboards** (Planned):
  - Group-based rankings
  - Weekly/monthly competitions

### 5. Notifications & Reminders (Planned)
- Study reminders
- Group activity alerts
- Achievement notifications

### 6. Group Chat (Planned)
- Text and image messages
- Thread/reply support
- Real-time communication

## Tech Stack

### Frontend
- **React 19.2.0**: Modern UI with hooks
- **React Router v6**: Protected routes with authentication
- **Tailwind CSS 4.1.17**: Utility-first styling
- **Clerk React 5.56.0**: Authentication UI and JWT management
- **Mantine Core 8.3.9**: UI components (Calendar, Date pickers)
- **Vite 7.1.7**: Fast development server

### Backend
- **FastAPI**: Async Python web framework
- **SQLAlchemy 2.0.43**: Async ORM with type hints
- **AsyncPG 0.30.0**: High-performance async PostgreSQL driver
- **Clerk Backend API 3.3.1**: JWT verification
- **Pydantic 2.12.0**: Request/response validation
- **Python 3.11**: Modern async/await patterns
- **Uvicorn 0.37.0**: ASGI server

### Database
- **PostgreSQL (Neon)**: Cloud-hosted with connection pooling
- **Async Operations**: All queries use async/await
- **Lazy User Creation**: Users created on first authenticated request

### Infrastructure
- **CORS Middleware**: Configured for localhost development
- **Auto-commit/rollback**: Database session management
- **Environment Variables**: Secure configuration

## Project Structure

```
study-sync/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── database.py          # Async engine, session, get_db dependency
│   │   │   └── models.py            # All database models
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── Dashboard.py         # Dashboard endpoint
│   │   │   ├── streaks.py           # Streak CRUD endpoints
│   │   │   ├── users.py             # User profile endpoints
│   │   │   └── groups.py            # (To implement) Group & resource endpoints
│   │   │
│   │   ├── services/
│   │   │   ├── user_service.py      # User business logic (lazy creation!)
│   │   │   ├── streak_service.py    # Streak calculations
│   │   │   └── resources.py         # (Empty) Resource management
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── users.py             # User request/response models
│   │   │   └── streaks.py           # Streak models
│   │   │
│   │   ├── dependencies.py          # FastAPI dependencies (get_current_user)
│   │   ├── utils.py                 # Clerk authentication utilities
│   │   └── app.py                   # FastAPI app with CORS and routers
│   │
│   ├── init_db.py                   # Database table creation script
│   ├── server.py                    # Uvicorn server entry point
│   ├── .env.example                 # Environment template
│   ├── .env                         # Actual environment variables (gitignored)
│   ├── pyproject.toml               # Dependencies (uv/pip)
│   └── .python-version              # Python 3.11
│
└── frontend/
    ├── src/
    │   ├── auth/
    │   │   ├── ClerkProviderWithRoutes.jsx  # Clerk setup with routing
    │   │   ├── AuthenticationPage.jsx       # Login/Signup UI
    │   │   └── EmailVerification.jsx        # Email verification flow
    │   │
    │   ├── pages/
    │   │   ├── Home.jsx                     # Landing page
    │   │   └── Dashboard.jsx                # Main dashboard (with API calls)
    │   │
    │   ├── components/
    │   │   ├── CalendarComponent.jsx        # Streak calendar
    │   │   ├── TimeTracker.jsx              # Study timer
    │   │   └── MotivationCard.jsx           # Random quotes
    │   │
    │   ├── utils/
    │   │   └── api.js                       # API helper with authentication
    │   │
    │   ├── App.jsx                          # Route definitions
    │   └── main.jsx                         # React entry point
    │
    ├── .env.example                         # Frontend env template
    ├── .env                                 # Actual env vars (gitignored)
    └── package.json                         # Node dependencies
```

## Database Schema

### Core Tables
- **users**: User data synced from Clerk
  - `user_id` (PK, string): Clerk user ID
  - `username`, `email`: Cached from Clerk token
  - `first_name`, `last_name`: User's full name
  - `total_study_time`: Aggregate study seconds
  - `preferences`: JSON string for settings
  - `created_at`, `updated_at`: Timestamps

- **groups**: Study groups
  - `id` (PK, serial)
  - `creator_id` (FK → users): Group creator
  - `group_name`, `description`, `image`
  - `group_type`: leader_controlled | community
  - `visibility`: public | private
  - `invite_code`: Optional code for private groups
  - `max_members`: Optional capacity limit
  - `is_active`: Soft delete flag

- **groupings**: User-group memberships (many-to-many)
  - Composite PK: (`user_id`, `group_id`)
  - `role`: leader | admin | member
  - `invitation_status`: pending | accepted | declined
  - `invited_by` (FK → users)
  - `is_connected`: Active session flag

- **group_invitations**: Pending invites
  - `id` (PK, serial)
  - `group_id` (FK → groups)
  - `invited_user_id`, `invited_by` (FK → users)
  - `status`, `expires_at`, `responded_at`

- **resources**: Shared files/folders
  - `id` (PK, serial)
  - `uploaded_by` (FK → users)
  - `group_id` (FK → groups)
  - `url`, `resource_type`, `title`, `description`
  - `parent_folder_id`: Self-referencing for folders
  - `file_size`, `is_deleted`

- **streaks**: User study streaks
  - `id` (PK, serial)
  - `user_id` (FK → users, unique)
  - `current_streak`, `longest_streak`
  - `last_active_date`, `streak_start_date`

- **timespends**: Study session logs
  - `id` (PK, serial)
  - `user_id` (FK → users), `group_id` (FK → groups)
  - `duration_seconds`, `session_date`
  - `started_at`, `ended_at`

- **messages**: Group chat (planned)
  - `id` (PK, serial)
  - `user_id`, `group_id`
  - `content`, `message_type`: text | image
  - `reply_to_id`: Self-referencing for threads
  - `is_edited`, `is_deleted`

- **notifications**: User alerts (planned)
  - `id` (PK, serial)
  - `user_id`, `notification_message`, `notification_type`
  - `is_read`, `created_at`

### Key Relationships
- Users ↔ Groups: Many-to-many via `groupings`
- Groups → Resources: One-to-many
- Resources → Resources: Self-referencing (folders)
- Users → Streaks: One-to-one
- Users → TimeSpends: One-to-many

## API Architecture

### Authentication Flow (Lazy Creation)
```
1. User signs up/logs in → Clerk generates JWT
2. Frontend stores JWT in Clerk session
3. Frontend makes API request with JWT in Authorization header
4. Backend (utils.py): Validates JWT, extracts user info
5. Backend (dependencies.py): Checks if user exists in DB
   → If NO: Creates user automatically (LAZY CREATION)
   → If YES: Returns existing user
6. Backend: Performs operation with authenticated user
```

### API Request Pattern (Frontend)
```javascript
import { useAuth } from '@clerk/clerk-react';

const { getToken } = useAuth();
const token = await getToken();

fetch('http://localhost:8000/api/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### API Endpoints

#### Users
- `GET /api/users/me` - Get current user profile (lazy creates if first time)
- `PATCH /api/users/me` - Update profile (username, first_name, last_name, preferences)
- `GET /api/users/{user_id}` - Get any user's public profile

#### Dashboard
- `GET /api/dashboard` - Get dashboard with user info and stats

#### Streaks
- `GET /api/streaks/me` - Get current user's streak
- `POST /api/streaks/update` - Update streak (daily check-in)
- `GET /api/streaks/{user_id}` - Get any user's streak (public)

#### Groups (To Implement)
- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `GET /api/groups/{id}` - Get group details
- `PATCH /api/groups/{id}` - Update group
- `DELETE /api/groups/{id}` - Delete group
- `POST /api/groups/{id}/join` - Join public group
- `POST /api/groups/{id}/invite` - Invite user to private group

#### Resources (To Implement)
- `POST /api/groups/{id}/resources` - Upload resource
- `GET /api/groups/{id}/resources` - List group resources
- `PATCH /api/resources/{id}` - Update resource
- `DELETE /api/resources/{id}` - Delete resource

## Development Workflow

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e .   # or: pip install -e .

# Configure environment
cp .env.example .env
# Edit .env: Add DATABASE_URL, CLERK_SECRET_KEY, JWT_KEY

# Initialize database
python -m backend.init_db

# Start server
python server.py  # or: uv run python server.py
# Server runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Frontend Setup
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env: Add VITE_CLERK_PUBLISHABLE_KEY

# Start dev server
npm run dev
# Server runs on http://localhost:5173
```

### Environment Variables

**Backend (`backend/.env`)**:
```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/db
CLERK_SECRET_KEY=sk_test_xxxxx
JWT_KEY=your_jwt_key_from_clerk_dashboard
```

**Frontend (`frontend/.env`)**:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:8000  # Optional, defaults to localhost:8000
```

### Testing API Endpoints

**Using FastAPI Docs** (Recommended for development):
1. Go to `http://localhost:8000/docs`
2. Click "Authorize" button
3. Get token from browser console: `await useAuth().getToken()`
4. Paste token, click "Authorize"
5. Test endpoints directly in browser

**Using curl**:
```bash
# Get token from frontend console first
TOKEN="your_jwt_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users/me
```

**Using JavaScript (Browser Console)**:
```javascript
const { getToken } = useAuth();
const token = await getToken();
const res = await fetch('http://localhost:8000/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await res.json();
console.log(data);
```

## Current Implementation Status

### ✅ Completed
- **Authentication**:
  - Clerk integration (email/password, Google OAuth)
  - JWT token validation
  - Lazy user creation (no webhooks!)
  - Protected routes and dependencies

- **Backend**:
  - Database models with proper relationships
  - Async SQLAlchemy setup
  - User CRUD endpoints
  - Streak tracking endpoints
  - Dashboard endpoint
  - CORS configuration
  - Auto-commit/rollback session management

- **Frontend**:
  - Landing page with feature showcase
  - Dashboard with user greeting
  - Time tracker component
  - Streak calendar visualization
  - Protected routes
  - API integration (needs token fix)

### 🚧 In Progress
- Fixing frontend-backend authentication (adding token to requests)
- Group creation and management
- Resource upload system

### 📋 Planned
- Group invitations flow
- Resource CRUD with permissions
- Group chat (WebSockets)
- Leaderboards
- Notifications system
- Advanced analytics
- Mobile responsiveness

## Key Architectural Decisions

### 1. Lazy User Creation (No Webhooks)
**Why**: Simpler development, no ngrok needed, resilient to network issues
**How**: `get_current_user` dependency checks DB and creates user on first request
**Trade-off**: First request ~50ms slower (one-time per user)

### 2. Async Everything
**Why**: Non-blocking I/O for better concurrency
**Stack**: FastAPI + SQLAlchemy async + AsyncPG
**Benefit**: Can handle many concurrent requests efficiently

### 3. JWT Token Validation
**Why**: Stateless authentication, no server-side sessions
**Flow**: Frontend gets token from Clerk → Includes in Authorization header → Backend validates
**Security**: Clerk handles token signing/expiry

### 4. Dependency Injection
**Why**: Clean separation of concerns, easy testing
**Pattern**: `get_db()`, `get_current_user()` as FastAPI dependencies
**Benefit**: Automatic session management and authentication

## Performance Considerations

### Database
- **Connection Pooling**: Configured in SQLAlchemy engine
- **Async Queries**: All DB operations use async/await
- **Indexes**: On `user_id`, `group_id`, `email`, `username`
- **Lazy Loading**: Fetch only needed columns

### API
- **Async Endpoints**: FastAPI handles concurrent requests
- **Pydantic Validation**: Fast request/response serialization
- **CORS**: Configured for development origins

### Frontend
- **Code Splitting**: React Router lazy loading (planned)
- **Memoization**: useMemo/useCallback for expensive computations
- **API Caching**: Consider React Query (future enhancement)

## Security Measures

### Backend
- ✅ JWT validation on every protected endpoint
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ Input validation (Pydantic schemas)
- ✅ CORS configured for known origins
- ✅ Environment variables for secrets
- ⏳ Rate limiting (planned)
- ⏳ Permission checks for group operations (planned)

### Frontend
- ✅ Clerk handles auth UI and token management
- ✅ Protected routes with authentication checks
- ✅ Environment variables for API keys
- ⏳ Input sanitization for user content (planned)

## Troubleshooting Common Issues

### 401 Unauthorized Errors
**Cause**: Frontend not sending JWT token in Authorization header
**Fix**: Use `await getToken()` and include in fetch headers

### Database Connection Errors
**Cause**: Wrong DATABASE_URL or database not accessible
**Fix**: Verify Neon database URL and ensure IP is whitelisted

### CORS Errors
**Cause**: Frontend origin not in CORS allow list
**Fix**: Add frontend URL to `allow_origins` in `app.py`

### User Not Found After Signup
**Cause**: First request hasn't been made yet (lazy creation)
**Fix**: This is normal! User created on first authenticated request

## Future Enhancements

### Short-term (Next Sprint)
- Complete groups CRUD with invite system
- Resource upload with file storage
- Permission system for group operations
- Basic leaderboards

### Medium-term
- Group chat with WebSockets
- Notification system
- Advanced analytics dashboard
- Mobile-responsive design improvements

### Long-term
- AI-powered study recommendations
- Native mobile apps (React Native)
- Integrations (Google Drive, Notion)
- Premium tier with advanced features

---

**Version**: 1.1  
**Last Updated**: December 2024  
**Maintained By**: Development Team

**Note**: This document is actively maintained. Reference specific sections when requesting AI assistance to provide context efficiently.