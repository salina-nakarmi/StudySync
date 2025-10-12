# StudySync

A full-stack application with FastAPI backend and React frontend.

## 📋 Prerequisites

Before you start, make sure you have these installed on your computer:

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js & npm** - [Download Node.js](https://nodejs.org/)
- **uv** (Python package manager) - Install with: `pip install uv`

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/salina-nakarmi/StudySync.git
cd auth
```

### 2. Backend Setup (FastAPI)

**For Backend Team:**

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment using uv:
   ```bash
   uv venv
   ```

3. Activate the virtual environment:
   - **Windows:**
     ```bash
     .venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     source .venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   uv sync
   ```

5. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Or create a new `.env` file with necessary variables

6. Run the backend server:
   ```bash
   uvicorn app:app --reload
   ```
   
   The backend should now be running at: `http://localhost:8000`

### 3. Frontend Setup (React)

**For Frontend Team:**

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Or create a new `.env` file with necessary variables

4. Start the development server:
   ```bash
   npm start
   ```
   
   The frontend should now be running at: `http://localhost:3000`


## 👥 Team Workflow

### Backend Team
- Work in the `backend/` directory
- Create API endpoints in `backend/src/routes/`
- Handle database operations in `backend/src/database/`
- Test your endpoints at `http://localhost:8000/docs` (FastAPI auto-generates API docs!)

### Frontend Team
- Work in the `frontend/` directory
- Create components in `frontend/src/`
- API calls should point to `http://localhost:8000`
- Test your UI at `http://localhost:3000`

## 🔧 Common Commands

### Backend (uv)
```bash
# Install a new package
uv add package-name


# Deactivate virtual environment
deactivate
```

### Frontend (npm)
```bash
# Install a new package
npm install package-name

# Build for production
npm run build

# Run tests
npm test
```




## 📝 Notes

- Always pull the latest changes before starting work: `git pull origin main`
- Create a new branch for your feature: `git checkout -b feature-name`
- Don't commit your `.env` file or virtual environment folders
- Ask questions in the team chat if you're stuck!

## 🤝 Contributing

1. Create a new branch from `main`
2. Make your changes
3. Test your changes locally
4. Commit with a clear message
5. Push to your branch
6. Create a Pull Request


---

## Authentication try
    
        http://localhost:5173/sign-in
        


**Happy Coding! 🎉**