from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import Dashboard, streaks, users, resources, groups, study_sessions
from .services import socket_services

app = FastAPI(
    title="StudySync API",
    description="Backend API for StudySync Application",
    version="1.0.0",
    redirect_slashes=False 
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Include routers
app.include_router(Dashboard.router, prefix="/api")
app.include_router(streaks.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(groups.router, prefix="/api") 
app.include_router(study_sessions.router, prefix="/api") 

@app.get("/")
async def root():
    return {
        "message": "Welcome to StudySync API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket):
    await websoket.accept()