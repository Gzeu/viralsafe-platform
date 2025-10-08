from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from bson import ObjectId
from enum import Enum

from .user import PyObjectId

class PostType(str, Enum):
    """Post content types"""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    GIF = "gif"
    MEME = "meme"

class PostStatus(str, Enum):
    """Post moderation status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REMOVED = "removed"
    VIRAL = "viral"  # Special status for viral content

class VoteType(str, Enum):
    """Vote types"""
    UP = "up"    # Pozitiv
    DOWN = "down" # Negativ
    VIRAL = "viral" # Super pozitiv - costa mai multe tokens

class MediaFile(BaseModel):
    """Media file information"""
    url: str
    filename: str
    size: int  # bytes
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None  # seconds pentru video/audio
    ipfs_hash: Optional[str] = None
    thumbnail_url: Optional[str] = None
    thumbnail_ipfs_hash: Optional[str] = None

class PostMetrics(BaseModel):
    """Post engagement metrics"""
    up_votes: int = 0
    down_votes: int = 0
    viral_votes: int = 0
    total_votes: int = 0
    viral_score: int = 0  # Calculat pe baza voturilor și engagement
    views: int = 0
    shares: int = 0
    comments_count: int = 0
    tokens_earned: float = 0.0
    engagement_rate: float = 0.0
    virality_index: float = 0.0  # 0-100 scale

 class Config:
        schema_extra = {
            "example": {
                "up_votes": 150,
                "down_votes": 10,
                "viral_votes": 25,
                "total_votes": 185,
                "viral_score": 1250,
                "views": 5000,
                "engagement_rate": 85.5
            }
        }

class NFTMetadata(BaseModel):
    """NFT metadata for viral posts"""
    token_id: Optional[int] = None
    contract_address: Optional[str] = None
    token_uri: Optional[str] = None
    metadata_ipfs_hash: Optional[str] = None
    minted_at: Optional[datetime] = None
    minted_tx_hash: Optional[str] = None
    is_minted: bool = False
    auto_minted: bool = False  # Dacă a fost mint automat la viral threshold
    royalty_percentage: float = 5.0  # Default 5% royalties
    current_owner: Optional[str] = None
    last_sale_price: Optional[float] = None
    last_sale_date: Optional[datetime] = None

class PostTags(BaseModel):
    """Post categorization tags"""
    category: Optional[str] = None  # funny, music, dance, etc.
    hashtags: List[str] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)  # @username mentions
    trending_topics: List[str] = Field(default_factory=list)
    ai_generated_tags: List[str] = Field(default_factory=list)
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        return [tag.lower().replace('#', '') for tag in v if tag]

# Database Model
class PostInDB(BaseModel):
    """Post model for database storage"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    author_id: PyObjectId = Field(...)
    author_wallet: str = Field(...)
    
    # Content
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., max_length=2000)  # Text content
    content_type: PostType = PostType.TEXT
    media_files: List[MediaFile] = Field(default_factory=list)
    
    # Classification
    status: PostStatus = PostStatus.PUBLISHED
    tags: PostTags = Field(default_factory=PostTags)
    
    # Engagement
    metrics: PostMetrics = Field(default_factory=PostMetrics)
    
    # NFT Information
    nft_metadata: Optional[NFTMetadata] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    viral_at: Optional[datetime] = None  # Când a devenit viral
    
    # Moderation
    flagged: bool = False
    flag_reasons: List[str] = Field(default_factory=list)
    moderator_notes: Optional[str] = None
    moderated_at: Optional[datetime] = None
    
    # Analytics
    location_data: Optional[Dict[str, Any]] = None  # Geographic info
    device_info: Optional[Dict[str, Any]] = None    # Device/browser info
    referrer: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "author_wallet": "0x742d35Cc6634C0532925a3b8D83c4E123456789a",
                "title": "My Viral Dance Challenge",
                "content": "Check out this amazing dance move! 🕺 #ViralDance #Web3Creator",
                "content_type": "video",
                "status": "published"
            }
        }

# API Models
class PostCreate(BaseModel):
    """Post creation model"""
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=1, max_length=2000)
    content_type: PostType = PostType.TEXT
    hashtags: List[str] = Field(default_factory=list, max_items=10)
    category: Optional[str] = None
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        return [tag.lower().replace('#', '') for tag in v if tag][:10]

class PostUpdate(BaseModel):
    """Post update model"""
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    hashtags: Optional[List[str]] = Field(None, max_items=10)
    category: Optional[str] = None
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        if v is not None:
            return [tag.lower().replace('#', '') for tag in v if tag][:10]
        return v

class PostResponse(BaseModel):
    """Post response model for API"""
    id: str
    author_id: str
    author_wallet: str
    author_username: Optional[str] = None  # Populated via join
    author_avatar: Optional[str] = None
    
    title: Optional[str]
    content: str
    content_type: PostType
    media_files: List[MediaFile]
    
    status: PostStatus
    tags: PostTags
    metrics: PostMetrics
    nft_metadata: Optional[NFTMetadata]
    
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    viral_at: Optional[datetime]
    
    # User interaction state (populated based on current user)
    user_vote: Optional[VoteType] = None
    user_has_voted: bool = False
    user_can_mint: bool = False
    
    class Config:
        json_encoders = {ObjectId: str}

class PostListResponse(BaseModel):
    """Paginated post list response"""
    posts: List[PostResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool

class PostVote(BaseModel):
    """Vote creation model"""
    post_id: str
    vote_type: VoteType
    
class PostVoteResponse(BaseModel):
    """Vote response model"""
    success: bool
    message: str
    new_metrics: PostMetrics
    tokens_spent: float
    tokens_earned: Optional[float] = None  # Pentru author
    viral_threshold_reached: bool = False
    nft_auto_minted: bool = False

# Vote tracking model
class VoteInDB(BaseModel):
    """Vote tracking in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    user_wallet: str
    post_id: PyObjectId
    vote_type: VoteType
    tokens_spent: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Feed and discovery models
class FeedType(str, Enum):
    """Feed algorithm types"""
    TRENDING = "trending"    # Sorted by viral score
    LATEST = "latest"        # Most recent posts
    FOLLOWING = "following"  # From followed users
    PERSONALIZED = "personalized" # AI-powered recommendations
    VIRAL = "viral"          # Only viral posts (above threshold)

class FeedRequest(BaseModel):
    """Feed request parameters"""
    feed_type: FeedType = FeedType.TRENDING
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    category: Optional[str] = None
    hashtag: Optional[str] = None
    time_range: Optional[str] = None  # today, week, month, all
    min_viral_score: Optional[int] = None
    
class TrendingPost(PostResponse):
    """Enhanced post model for trending feed"""
    trending_score: float
    trending_rank: int
    growth_rate: float  # Viral score growth în ultimele 24h
    predicted_viral_potential: float  # AI prediction 0-100

class TrendingFeedResponse(BaseModel):
    """Trending feed response"""
    posts: List[TrendingPost]
    total: int
    page: int
    size: int
    pages: int
    algorithm_version: str = "v1.0"
    last_updated: datetime = Field(default_factory=datetime.utcnow)