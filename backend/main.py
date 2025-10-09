from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
import os
import time
import psutil
from datetime import datetime
from typing import Optional
from pydantic import BaseSettings
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger

# Import routers - with error handling for missing modules
try:
    from app.routers import auth, posts, nft, staking, users, analytics
    from app.core.config import get_settings
    from app.core.database import get_database
    from app.core.cache import get_redis
    from app.middleware.rate_limit import RateLimitMiddleware
    from app.middleware.metrics import MetricsMiddleware
except ImportError as e:
    logger.warning(f"Some modules not available: {e}")
    # Create dummy routers for development
    class DummyRouter:
        def __init__(self):
            pass
    
    auth = posts = nft = staking = users = analytics = DummyRouter()

# Global variables for database and cache connections
database = None
cache = None
start_time = time.time()

# Simple settings fallback
class Settings:
    def __init__(self):
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.database_name = os.getenv("DATABASE_NAME", "viralsafe")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with error handling"""
    global database, cache
    
    try:
        # Initialize database connection
        client = AsyncIOMotorClient(settings.mongodb_url)
        database = client[settings.database_name]
        
        # Initialize Redis cache
        cache = redis.from_url(settings.redis_url, decode_responses=True)
        
        # Test connections
        await client.admin.command('ping')
        await cache.ping()
        logger.info("✅ Database and cache connections established")
    except Exception as e:
        logger.error(f"❌ Connection failed: {e}")
        # Continue without database for basic functionality
        database = None
        cache = None
    
    yield
    
    # Cleanup connections
    try:
        if database:
            client.close()
        if cache:
            await cache.close()
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

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
        "https://*.onrender.com", # Render deployments
    ] + settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Render optimization middleware
@app.middleware("http")
async def optimize_for_render(request: Request, call_next):
    """Optimizări specifice pentru Render free tier"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    # Add performance headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Server"] = "ViralSafe-Render"
    
    # Cache static responses
    if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
        response.headers["Cache-Control"] = "public, max-age=300"
    
    # Keep-alive pentru a reduce cold starts
    response.headers["Connection"] = "keep-alive"
    
    # Log pentru monitoring
    logger.info(f"Request: {request.method} {request.url.path} - {process_time:.3f}s")
    
    return response

# Add custom middleware with error handling
try:
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(MetricsMiddleware)
except:
    logger.warning("Custom middleware not available")

# Security scheme
security = HTTPBearer()

async def check_db_health():
    """Check database health"""
    try:
        if database:
            await database.command('ping')
            return "healthy"
        return "not_configured"
    except:
        return "unhealthy"

async def check_redis_health():
    """Check Redis health"""
    try:
        if cache:
            await cache.ping()
            return "healthy"
        return "not_configured"
    except:
        return "unhealthy"

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": "0.3.0",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": time.time() - start_time,
        "database": await check_db_health(),
        "cache": await check_redis_health(),
        "environment": settings.environment
    }

# Detailed health check for monitoring
@app.get("/health/detailed", tags=["Health"])
async def detailed_health():
    """Detailed health check pentru monitoring extern"""
    try:
        memory = psutil.virtual_memory()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": time.time() - start_time,
            "database": await check_db_health(),
            "cache": await check_redis_health(),
            "memory_usage_percent": memory.percent,
            "memory_available_mb": memory.available // 1024 // 1024,
            "version": "0.3.0",
            "environment": settings.environment,
            "server": "Render"
        }
    except Exception as e:
        return {
            "status": "partial",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
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
        "health": "/health",
        "github": "https://github.com/Gzeu/viralsafe-platform",
        "status": "MVP Development - Render Deployment",
        "uptime": f"{(time.time() - start_time):.0f} seconds"
    }

# Basic API endpoints for testing
@app.get("/api/v1/status", tags=["API"])
async def api_status():
    """API status endpoint"""
    return {
        "api_version": "v1",
        "status": "active",
        "features": [
            "Authentication",
            "Posts",
            "NFT",
            "Staking",
            "Users",
            "Analytics"
        ],
        "database_connected": database is not None,
        "cache_connected": cache is not None
    }

# Include API routers with error handling
try:
    if hasattr(auth, 'router'):
        app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
    if hasattr(posts, 'router'):
        app.include_router(posts.router, prefix="/api/v1/posts", tags=["Posts"])
    if hasattr(nft, 'router'):
        app.include_router(nft.router, prefix="/api/v1/nft", tags=["NFT"])
    if hasattr(staking, 'router'):
        app.include_router(staking.router, prefix="/api/v1/staking", tags=["Staking"])
    if hasattr(users, 'router'):
        app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
    if hasattr(analytics, 'router'):
        app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
except Exception as e:
    logger.warning(f"Some routers not included: {e}")

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process real-time updates
            await websocket.send_text(f"ViralSafe Echo: {data}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found", 
        "message": "The requested resource does not exist",
        "path": str(request.url.path),
        "available_endpoints": ["/", "/health", "/docs", "/api/v1/status"]
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return {
        "error": "Internal server error", 
        "message": "Something went wrong on our end",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    # Get port from environment (Render sets this automatically)
    port = int(os.environ.get("PORT", 8000))
    
    # Production configuration for Render
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,  # Single worker pe free tier
        log_level="info",
        access_log=True,
        reload=False  # Disable reload în production
    )