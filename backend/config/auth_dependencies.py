"""
Authentication dependencies for FastAPI using OAuth2PasswordBearer
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import with error handling
try:
    from fastapi.security import OAuth2PasswordBearer
    from core.database import get_db
    from models.models import User
    from services.auth_utils import get_user_id_from_token
    
    # OAuth2 scheme - initialize lazily to avoid issues during import
    try:
        oauth2_scheme = OAuth2PasswordBearer(
            tokenUrl="/api/token",  # Use the OAuth2 standard endpoint
            scheme_name="OAuth2PasswordBearer",
            auto_error=False  # Don't auto-raise on missing token
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Error initializing OAuth2PasswordBearer: {e}")
        # Create a fallback that won't cause import errors
        oauth2_scheme = OAuth2PasswordBearer(
            tokenUrl="/api/token",
            scheme_name="OAuth2PasswordBearer",
            auto_error=False
        )
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Error importing auth dependencies: {e}", exc_info=True)
    # Set defaults to None so module can still be imported
    # Functions will fail at runtime with clear errors
    oauth2_scheme = None
    get_db = None
    User = None
    get_user_id_from_token = None

# Create fallback dependency functions
def _fallback_token():
    return None

def _fallback_db():
    return None

# Use the actual dependencies if available, otherwise use fallbacks
_token_dep = Depends(oauth2_scheme) if oauth2_scheme else Depends(_fallback_token)
_db_dep = Depends(get_db) if get_db else Depends(_fallback_db)

def get_current_user(
    token: str = _token_dep,
    db: Session = _db_dep
):
    """
    Dependency to get the current authenticated user using OAuth2PasswordBearer
    """
    if not oauth2_scheme or not get_db or not User or not get_user_id_from_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication dependencies not properly initialized. Check server logs."
        )
    
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
