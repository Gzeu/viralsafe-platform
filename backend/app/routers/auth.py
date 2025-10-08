from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import secrets
import jwt
from eth_account.messages import encode_defunct
from eth_account import Account
import hashlib

from ..core.config import get_settings
from ..models.user import UserCreate, UserResponse, UserInDB
from ..core.database import get_database
from ..core.security import create_access_token, create_refresh_token, verify_token

router = APIRouter()
security = HTTPBearer()
settings = get_settings()

# Request/Response Models
class AuthRequest(BaseModel):
    """Web3 authentication request"""
    wallet_address: str = Field(..., min_length=42, max_length=42)
    
class NonceResponse(BaseModel):
    """Nonce response for wallet signature"""
    nonce: str
    message: str
    wallet_address: str

class SignatureRequest(BaseModel):
    """Signature verification request"""
    wallet_address: str = Field(..., min_length=42, max_length=42)
    signature: str
    nonce: str
    user_data: Optional[UserCreate] = None  # Pentru noi utilizatori

class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    is_new_user: bool = False

class RefreshRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str

class LogoutRequest(BaseModel):
    """Logout request"""
    refresh_token: Optional[str] = None

# Helper functions
def generate_nonce() -> str:
    """Generate secure random nonce"""
    return secrets.token_hex(16)

def create_auth_message(wallet_address: str, nonce: str) -> str:
    """Create standardized message for wallet signature"""
    timestamp = datetime.utcnow().isoformat()
    return f"""🚀 ViralSafe Authentication

Wallet: {wallet_address}
Nonce: {nonce}
Timestamp: {timestamp}

Sign this message to authenticate with ViralSafe Platform.
This request will not trigger any blockchain transaction or cost any gas fees.

Security: This signature proves you own this wallet address."""

def verify_signature(message: str, signature: str, wallet_address: str) -> bool:
    """Verify wallet signature"""
    try:
        # Encode message for Ethereum signature verification
        encoded_message = encode_defunct(text=message)
        
        # Recover address from signature
        recovered_address = Account.recover_message(encoded_message, signature=signature)
        
        # Compare addresses (case insensitive)
        return recovered_address.lower() == wallet_address.lower()
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        wallet_address = payload.get("sub")
        if wallet_address is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get user from database
        db = await get_database()
        user = await db.users.find_one({"wallet_address": wallet_address.lower()})
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Update last login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        return UserInDB(**user)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        )

# Routes
@router.post("/request-nonce", response_model=NonceResponse)
async def request_nonce(request: AuthRequest):
    """Request nonce for wallet signature authentication"""
    try:
        wallet_address = request.wallet_address.lower()
        nonce = generate_nonce()
        message = create_auth_message(wallet_address, nonce)
        
        # Store nonce in database with expiration (5 minutes)
        db = await get_database()
        await db.auth_nonces.update_one(
            {"wallet_address": wallet_address},
            {
                "$set": {
                    "nonce": nonce,
                    "message": message,
                    "created_at": datetime.utcnow(),
                    "expires_at": datetime.utcnow() + timedelta(minutes=5)
                }
            },
            upsert=True
        )
        
        return NonceResponse(
            nonce=nonce,
            message=message,
            wallet_address=wallet_address
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate nonce"
        )

@router.post("/verify-signature", response_model=AuthResponse)
async def verify_signature_and_login(request: SignatureRequest):
    """Verify wallet signature and authenticate user"""
    try:
        wallet_address = request.wallet_address.lower()
        
        # Get nonce from database
        db = await get_database()
        nonce_doc = await db.auth_nonces.find_one({"wallet_address": wallet_address})
        
        if not nonce_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nonce not found. Please request a new nonce."
            )
        
        # Check nonce expiration
        if datetime.utcnow() > nonce_doc["expires_at"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nonce has expired. Please request a new nonce."
            )
        
        # Verify nonce matches
        if nonce_doc["nonce"] != request.nonce:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid nonce"
            )
        
        # Verify signature
        if not verify_signature(nonce_doc["message"], request.signature, wallet_address):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
        
        # Check if user exists
        user = await db.users.find_one({"wallet_address": wallet_address})
        is_new_user = False
        
        if not user:
            # Create new user
            if not request.user_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User data required for new registration"
                )
            
            # Check username availability
            existing_username = await db.users.find_one({"username": request.user_data.username.lower()})
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Username already taken"
                )
            
            # Create new user document
            new_user = UserInDB(
                wallet_address=wallet_address,
                username=request.user_data.username.lower(),
                display_name=request.user_data.display_name,
                bio=request.user_data.bio,
                email=request.user_data.email,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            
            result = await db.users.insert_one(new_user.dict(by_alias=True, exclude_unset=True))
            user = await db.users.find_one({"_id": result.inserted_id})
            is_new_user = True
        else:
            # Update last login for existing user
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
        
        # Clean up used nonce
        await db.auth_nonces.delete_one({"wallet_address": wallet_address})
        
        # Create tokens  
        access_token = create_access_token(subject=wallet_address)
        refresh_token = create_refresh_token(subject=wallet_address)
        
        # Store refresh token
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"refresh_token": refresh_token}}
        )
        
        user_response = UserResponse(**user)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_response,
            is_new_user=is_new_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshRequest):
    """Refresh access token using refresh token"""
    try:
        payload = verify_token(request.refresh_token, token_type="refresh")
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        wallet_address = payload.get("sub")
        
        # Verify refresh token in database
        db = await get_database()
        user = await db.users.find_one({
            "wallet_address": wallet_address,
            "refresh_token": request.refresh_token
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new tokens
        new_access_token = create_access_token(subject=wallet_address)
        new_refresh_token = create_refresh_token(subject=wallet_address)
        
        # Update refresh token in database
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"refresh_token": new_refresh_token}}
        )
        
        user_response = UserResponse(**user)
        
        return AuthResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post("/logout")
async def logout(request: LogoutRequest, current_user: UserInDB = Depends(get_current_user)):
    """Logout user and invalidate refresh token"""
    try:
        db = await get_database()
        
        # Remove refresh token from database
        await db.users.update_one(
            {"_id": current_user.id},
            {"$unset": {"refresh_token": ""}}
        )
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(**current_user.dict())

@router.get("/status")
async def auth_status():
    """Check authentication service status"""
    return {
        "service": "authentication",
        "status": "healthy",
        "features": [
            "web3_wallet_auth",
            "jwt_tokens",
            "signature_verification",
            "nonce_based_auth"
        ],
        "supported_wallets": [
            "MetaMask",
            "WalletConnect",
            "Coinbase Wallet",
            "Trust Wallet"
        ]
    }