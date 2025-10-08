from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserRole(str, Enum):
    """User roles"""
    USER = "user"
    CREATOR = "creator"
    MODERATOR = "moderator"
    ADMIN = "admin"

class UserStatus(str, Enum):
    """User status"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING = "pending"

class SocialLinks(BaseModel):
    """Social media links"""
    tiktok: Optional[str] = None
    twitter: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    discord: Optional[str] = None

class UserStats(BaseModel):
    """User statistics"""
    total_posts: int = 0
    total_votes_received: int = 0
    total_votes_given: int = 0
    total_nfts_minted: int = 0
    total_nfts_owned: int = 0
    total_tokens_earned: float = 0.0
    total_tokens_staked: float = 0.0
    viral_score: int = 0
    followers_count: int = 0
    following_count: int = 0
    level: int = 1
    
class UserPreferences(BaseModel):
    """User preferences and settings"""
    email_notifications: bool = True
    push_notifications: bool = True
    privacy_level: str = "public"  # public, friends, private
    auto_stake_rewards: bool = False
    preferred_language: str = "en"
    theme: str = "dark"  # dark, light, auto

# Database Model
class UserInDB(BaseModel):
    """User model for database storage"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    wallet_address: str = Field(..., min_length=42, max_length=42)
    email: Optional[EmailStr] = None
    username: str = Field(..., min_length=3, max_length=30)
    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    avatar_ipfs_hash: Optional[str] = None
    banner_url: Optional[str] = None
    banner_ipfs_hash: Optional[str] = None
    
    # User metadata
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    is_verified: bool = False
    is_creator: bool = False
    
    # Social and external links
    social_links: SocialLinks = Field(default_factory=SocialLinks)
    
    # Statistics
    stats: UserStats = Field(default_factory=UserStats)
    
    # Preferences
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    # Blockchain data
    token_balance: float = 0.0
    staked_balance: float = 0.0
    nft_count: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    email_verified_at: Optional[datetime] = None
    
    # Authentication
    nonce: Optional[str] = None  # Pentru Web3 signature verification
    refresh_token: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "wallet_address": "0x742d35Cc6634C0532925a3b8D83c4E123456789a",
                "username": "viral_creator",
                "display_name": "Viral Creator",
                "bio": "Creating viral content on Web3",
                "email": "creator@example.com",
                "role": "creator",
                "is_verified": True
            }
        }

# API Models
class UserCreate(BaseModel):
    """User creation model"""
    wallet_address: str = Field(..., min_length=42, max_length=42)
    username: str = Field(..., min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        if not v.startswith('0x'):
            raise ValueError('Wallet address must start with 0x')
        return v.lower()
    
    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower()

class UserUpdate(BaseModel):
    """User update model"""
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    email: Optional[EmailStr] = None
    social_links: Optional[SocialLinks] = None
    preferences: Optional[UserPreferences] = None
    
    @validator('username')
    def validate_username(cls, v):
        if v and not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower() if v else v

class UserResponse(BaseModel):
    """User response model for API"""
    id: str
    wallet_address: str
    username: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    banner_url: Optional[str]
    role: UserRole
    status: UserStatus
    is_verified: bool
    is_creator: bool
    social_links: SocialLinks
    stats: UserStats
    preferences: UserPreferences
    token_balance: float
    staked_balance: float
    nft_count: int
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        json_encoders = {ObjectId: str}

class UserListResponse(BaseModel):
    """Paginated user list response"""
    users: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int

class UserPublicProfile(BaseModel):
    """Public user profile (limited info)"""
    id: str
    username: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    banner_url: Optional[str]
    is_verified: bool
    is_creator: bool
    social_links: SocialLinks
    stats: UserStats
    created_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}