from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    app_name: str = "ViralSafe API"
    version: str = "0.3.0"
    environment: str = "development"
    debug: bool = True
    
    # API Configuration
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "viralsafe"
    
    # Cache
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 3600  # 1 hour
    
    # Web3 & Blockchain
    web3_provider_url: str = "https://bsc-testnet.public.blastapi.io"
    chain_id: int = 97  # BNB Testnet
    safe_token_address: str = ""
    viral_nft_address: str = ""
    staking_contract_address: str = ""
    private_key: Optional[str] = None  # Pentru server-side transactions
    
    # IPFS Storage
    pinata_jwt: str = ""
    pinata_api_key: str = ""
    pinata_secret: str = ""
    ipfs_gateway: str = "https://gateway.pinata.cloud/ipfs/"
    
    # External APIs
    tiktok_api_key: Optional[str] = None
    tiktok_api_secret: Optional[str] = None
    
    # Email (pentru notifications)
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_username: str = ""
    email_password: str = ""
    email_use_tls: bool = True
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600  # 1 hour
    
    # File Upload
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: List[str] = [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".webm"]
    
    # Social Features
    viral_threshold: int = 1000  # Minimum votes pentru NFT auto-minting
    min_staking_period_days: int = 7
    max_posts_per_day: int = 10
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    log_level: str = "INFO"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://viralsafe.io"
    ]
    
    # Cloud Deploy (Free Tier Optimized)
    # Railway, Render, Heroku free alternatives
    deploy_platform: str = "railway"  # railway, render, vercel-functions
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
    def get_database_url(self) -> str:
        """Get formatted database URL"""
        return self.mongodb_url
    
    def get_redis_url(self) -> str:
        """Get formatted Redis URL"""
        return self.redis_url
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment.lower() == "production"
    
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment.lower() == "development"

# Development settings
class DevelopmentSettings(Settings):
    environment: str = "development"
    debug: bool = True
    log_level: str = "DEBUG"
    
# Production settings
class ProductionSettings(Settings):
    environment: str = "production"
    debug: bool = False
    log_level: str = "INFO"
    # În production, toate secretele vin din environment variables
    
# Test settings
class TestSettings(Settings):
    environment: str = "test"
    database_name: str = "viralsafe_test"
    redis_url: str = "redis://localhost:6379/1"

@lru_cache()
def get_settings() -> Settings:
    """Get settings based on environment"""
    environment = os.getenv("ENVIRONMENT", "development").lower()
    
    if environment == "production":
        return ProductionSettings()
    elif environment == "test":
        return TestSettings()
    else:
        return DevelopmentSettings()

# Export settings instance
settings = get_settings()