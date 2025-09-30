"""
Authentication dependencies for FastAPI using OAuth2PasswordBearer
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User
from services.auth_utils import get_user_id_from_token

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/token",  # Use the OAuth2 standard endpoint
    scheme_name="OAuth2PasswordBearer"
)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user using OAuth2PasswordBearer
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Get user ID from token
        user_id = get_user_id_from_token(token)
        if not user_id:
            raise credentials_exception
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise credentials_exception
            
        # Check if user is verified and has completed profile
        if user.email_verified is not True:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified"
            )
            
        if user.password_hash is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password not set"
            )
            
        return user
        
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to get the current active user (with completed profile)
    """
    if not current_user.profile_completed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile not completed"
        )
    return current_user
