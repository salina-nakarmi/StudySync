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
- **Clerk Integration**: Secure authentication with email/password and OAuth (Google)
- **User Profiles**: Track total study time, preferences, and account settings
- **Session Management**: Automatic redirects and protected routes

### 2. Groups & Resource Sharing
- **Group Types**:
  - **Private Groups**: Invitation-only "friend circles" for closed study groups
  - **Public Groups**: Open communities anyone can join, discoverable through search/recommendations
  
- **Group Roles**:
  - **Leader**: Can manage resources and group settings (multiple leaders supported)
  - **Member**: Can view/use resources (in leader-controlled groups)
  - **Admin**: Full group management permissions

- **Resource Management**:
  - Upload and organize study materials (images, videos, files, folders)
  - Leader-controlled vs. community-managed resources based on group type
  - Folder organization with parent-child relationships

### 3. Time Tracking & Progress
- **Session Tracking**: Real-time study timer with visual progress indicators
- **Time Logging**: Records duration, start/end times for each study session
- **Analytics**: Weekly/monthly charts showing time spent across different subjects/resources
- **Personal Dashboard**: Overview of study patterns and progress

### 4. Gamification
- **Streak System**:
  - Current streak counter (consecutive days studied)
  - Longest streak achievement
  - Visual calendar showing active study days
  - Local storage persistence with daily updates

- **Leaderboards**:
  - Group-based rankings for competitive learning
  - Weekly/monthly performance tracking
  - Friend group competitions

### 5. Notifications & Reminders
- **Study Reminders**: Scheduled notifications for study sessions
- **Group Activity**: Alerts for new resources, messages, or invitations
- **Achievement Notifications**: Streak milestones and leaderboard changes

### 6. Group Chat (Planned)
- Text and image messages
- Thread/reply support
- Real-time communication for study discussions

## Tech Stack

### Frontend
- **React 19.2.0**: Modern UI with hooks
- **React Router v6**: Client-side routing with protected routes
- **Tailwind CSS 4.1.17**: Utility-first styling with custom components
- **Clerk React 5.56.0**: Authentication UI and session management
- **Mantine Core 8.3.9**: UI components (Calendar, Date pickers)
- **Vite 7.1.7**: Fast development build tool

### Backend
- **FastAPI**: Async Python web framework
- **SQLAlchemy 2.0.43**: Async ORM with PostgreSQL
- **AsyncPG**: Async PostgreSQL driver
- **Clerk Backend API**: User verification and JWT validation
- **Python 3.11**: Modern async/await patterns

### Database
- **PostgreSQL (Neon)**: Cloud-hosted database with async support
- **Async Sessions**: Non-blocking database operations
- **Connection Pooling**: Optimized connection management

### Infrastructure
- **Uvicorn**: ASGI server for FastAPI
- **CORS Middleware**: Cross-origin request handling
- **Environment Variables**: Secure configuration management

## Project Structure

```
study-sync/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── database.py          # Async SQLAlchemy engine & session
│   │   │   └── models.py            # Database models (Users, Groups, Resources, etc.)
│   │   ├── routes/
│   │   │   ├── Dashboard.py         # Dashboard endpoints
│   │   │   ├── streaks.py           # Streak management endpoints
│   │   │   ├── users.py             # User management endpoints
│   │   │   └── groups.py            # Group & resource endpoints (to implement)
│   │   ├── services/
│   │   │   └── streak_service.py    # Streak business logic
│   │   ├── schemas/
│   │   │   ├── users.py             # Pydantic user models
│   │   │   └── streaks.py           # Pydantic streak models
│   │   ├── app.py                   # FastAPI app initialization
│   │   └── utils.py                 # Clerk auth utilities
│   ├── init_db.py                   # Database initialization script
│   ├── server.py                    # Uvicorn server entry point
│   ├── .env.example                 # Environment variable template
│   └── pyproject.toml               # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── auth/
    │   │   ├── ClerkProviderWithRoutes.jsx  # Clerk setup
    │   │   ├── AuthenticationPage.jsx       # Login/Signup UI
    │   │   └── EmailVerification.jsx        # Email verification flow
    │   ├── pages/
    │   │   ├── Home.jsx                     # Landing page
    │   │   └── Dashboard.jsx                # Main dashboard
    │   ├── components/
    │   │   ├── CalendarComponent.jsx        # Streak calendar
    │   │   ├── TimeTracker.jsx              # Study timer
    │   │   └── MotivationCard.jsx           # Random quotes
    │   ├── utils/
    │   │   └── api.js                       # API request helper
    │   ├── App.jsx                          # Route definitions
    │   └── main.jsx                         # React entry point
    ├── .env.example                         # Frontend env template
    └── package.json                         # Node dependencies
```

## Database Schema

### Core Tables
- **users**: Clerk user data (user_id, username, email, first_name, last_name, total_study_time)
- **groups**: Study groups (creator, name, type, visibility, invite_code, max_members)
- **groupings**: User-group memberships (user_id, group_id, role, invitation_status, is_connected)
- **group_invitations**: Pending invitations (group_id, invited_user_id, invited_by, status, expires_at)
- **resources**: Shared study materials (uploaded_by, group_id, url, type, title, parent_folder_id)
- **streaks**: User study streaks (user_id, current_streak, longest_streak, last_active_date)
- **timespends**: Study session logs (user_id, group_id, duration_seconds, session_date)
- **messages**: Group chat messages (user_id, group_id, content, message_type, reply_to_id)
- **notifications**: User notifications (user_id, notification_message, type, is_read)

### Key Relationships
- Users can create multiple groups (1:many)
- Users can join multiple groups via groupings (many:many)
- Groups contain multiple resources (1:many)
- Resources can be nested in folders (self-referencing)
- Users track time across multiple groups (many:many via timespends)

## API Architecture

### Authentication Flow
1. Frontend: User signs up/logs in via Clerk UI
2. Clerk: Generates JWT with user claims
3. Frontend: Includes JWT in Authorization header for API requests
4. Backend: Validates JWT using Clerk SDK, extracts user_id
5. Backend: Performs database operations with authenticated user context

### API Patterns
- **RESTful Endpoints**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Async Operations**: All database queries use async/await
- **Error Handling**: Consistent HTTP status codes with detailed error messages
- **Request Validation**: Pydantic schemas for input validation
- **Response Models**: Structured JSON responses with Pydantic serialization

### Example Endpoints
```python
GET  /api/dashboard          # Get dashboard data for authenticated user
GET  /api/streaks/me         # Get current user's streak
POST /api/streaks/update     # Update streak (daily check-in)
GET  /api/users/me           # Get current user profile
GET  /api/streaks/{user_id}  # Get any user's streak (public)
```

## Development Workflow

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
cp .env.example .env  # Configure DATABASE_URL, CLERK_SECRET_KEY, JWT_KEY
python -m backend.init_db  # Initialize database tables
python server.py  # Start server on http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Configure VITE_CLERK_PUBLISHABLE_KEY
npm run dev  # Start dev server on http://localhost:5173
```

### Environment Variables
**Backend (.env)**:
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/db
CLERK_SECRET_KEY=sk_test_...
JWT_KEY=your_jwt_key
```

**Frontend (.env)**:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Current Implementation Status

### ✅ Completed
- User authentication (Clerk integration with email/password and Google OAuth)
- Database models and initialization
- Basic dashboard with user greeting
- Streak system (current/longest streaks, calendar visualization)
- Time tracker component (start/pause timer with circular progress)
- API endpoints for user profile, streaks, and dashboard
- Protected routes and authentication middleware
- Landing page with features showcase

### 🚧 In Progress
- Group creation and management UI
- Resource upload and organization
- Group leaderboards
- Notification system

### 📋 Planned
- Group chat functionality
- Advanced analytics (weekly/monthly charts)
- Resource search and recommendations
- Public group discovery
- Mobile responsiveness improvements
- Performance optimizations

## Design Principles

### Frontend
- **Component Composition**: Reusable, isolated components
- **State Management**: React hooks for local state, context for global state
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages

### Backend
- **Async First**: Non-blocking I/O for all database operations
- **Type Safety**: Pydantic models for request/response validation
- **Separation of Concerns**: Routes → Services → Database layers
- **Error Propagation**: Consistent error handling with HTTP exceptions
- **Security**: JWT validation, input sanitization, SQL injection prevention

## Key Considerations

### Performance
- **Database Queries**: Use SELECT only needed columns, proper indexing
- **Async Operations**: Leverage Python's asyncio for concurrent operations
- **Caching**: Consider Redis for session data and leaderboards (future)
- **Pagination**: Implement for lists of resources, messages, notifications

### Security
- **Authentication**: All protected endpoints verify JWT
- **Authorization**: Check user permissions for group operations
- **Input Validation**: Pydantic schemas prevent malformed data
- **SQL Injection**: SQLAlchemy ORM protects against injection attacks
- **CORS**: Properly configured for development and production

### Scalability
- **Database Connections**: Connection pooling with configurable limits
- **File Storage**: Consider cloud storage (S3/CloudFlare R2) for resources
- **Real-time Features**: WebSockets for chat and live updates (future)
- **Horizontal Scaling**: Stateless API design supports multiple instances

## Future Enhancements
- **AI-Powered Features**: Study recommendations based on patterns
- **Mobile Apps**: Native iOS/Android applications
- **Integrations**: Connect with Google Drive, Notion, Anki
- **Advanced Analytics**: ML-based insights on study effectiveness
- **Monetization**: Premium features (unlimited groups, advanced analytics)

---

**Note**: This document serves as a living reference for AI assistants and developers. When requesting code assistance, reference specific sections to provide context without repeating the entire project structure.