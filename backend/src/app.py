from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import Dashboard, streaks, users
from .database import init_db

app = FastAPI(
    title="StudySync API",
    description="Backend API for StudySync Application",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Include routers
app.include_router(Dashboard.router, prefix="/api")
app.include_router(streaks.router, prefix="/api")
app.include_router(users.router, prefix="/api")
@app.on_event("startup")
async def on_startup():
    await init_db()

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