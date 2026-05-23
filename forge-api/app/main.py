from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, is_sqlite
from app.routers import plants, dashboard, ai, chat, reports, websocket
from app.tasks.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Starting Forge AI Backend...")
    
    # In SQLite fallback mode, create tables automatically on start
    if is_sqlite:
        print("Running in SQLite fallback mode. Initializing database schema...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("SQLite schema initialized.")
        
    # Start background telemetry simulation scheduler
    await start_scheduler()
    
    yield
    
    # Shutdown actions
    await stop_scheduler()
    print("Forge AI Backend shutdown completed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(plants.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router) # Websocket path has its own root prefix /ws/live

@app.get("/")
async def root():
    return {"status": "operational", "service": "Forge AI Intelligence Engine", "version": "v1.0"}
