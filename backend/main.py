from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
from typing import Optional
from pydantic import BaseSettings
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient

# Import routers
from app.routers import auth, posts, nft, staking, users, analytics
from app.core.config import get_settings
from app.core.database import get_database
from app.core.cache import get_redis
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.metrics import MetricsMiddleware

# Global variables for database and cache connections
database = None
cache = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    settings = get_settings()
    
    # Initialize database connection
    global database, cache
    client = AsyncIOMotorClient(settings.mongodb_url)
    database = client[settings.database_name]
    
    # Initialize Redis cache
    cache = redis.from_url(settings.redis_url, decode_responses=True)
    
    # Test connections
    try:
        await client.admin.command('ping')
        await cache.ping()
        print("✅ Database and cache connections established")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    
    yield
    
    # Cleanup connections
    client.close()
    await cache.close()

# Create FastAPI app
app = FastAPI(
    title="ViralSafe API",
    description="🚀 Transformă viralitatea în active digitale prin Web3 și NFT",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development
        "https://*.vercel.app",   # Vercel deployments
        "https://viralsafe.io",   # Production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(RateLimitMiddleware)
app.add_middleware(MetricsMiddleware)

# Security scheme
security = HTTPBearer()

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        await database.command('ping')
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    try:
        # Check cache connection
        await cache.ping()
        cache_status = "healthy"
    except:
        cache_status = "unhealthy"
    
    return {
        "status": "healthy",
        "version": "0.3.0",
        "database": db_status,
        "cache": cache_status,
        "environment": get_settings().environment
    }

# API Info endpoint
@app.get("/", tags=["Root"])
async def root():
    """API information endpoint"""
    return {
        "app": "ViralSafe API",
        "version": "0.3.0",
        "description": "🚀 Transformă viralitatea în active digitale prin Web3 și NFT",
        "docs": "/docs",
        "github": "https://github.com/Gzeu/viralsafe-platform",
        "status": "MVP Development"
    }

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(posts.router, prefix="/api/v1/posts", tags=["Posts"])
app.include_router(nft.router, prefix="/api/v1/nft", tags=["NFT"])
app.include_router(staking.router, prefix="/api/v1/staking", tags=["Staking"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process real-time updates
            await websocket.send_text(f"Echo: {data}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "message": "The requested resource does not exist"}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {"error": "Internal server error", "message": "Something went wrong on our end"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )