from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User
from schemas import UserCreate, UserUpdate, UserResponse, UserListResponse, MessageResponse, EmailVerificationResponse, EmailSentResponse
from utils import assign_frontend_design
from email_service import send_verification_email, verify_token

# Create router for user routes
router = APIRouter(prefix="/api", tags=["users"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user and send verification email"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.school_email == user.school_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create new user (email_verified starts as None - pending)
    db_user = User(
        name=user.name,
        gender=user.gender,
        major=user.major,
        profile_picture=user.profile_picture,
        school_email=user.school_email,
        academic_year=user.academic_year,
        frontend_design=assign_frontend_design(),
        email_verified=None,  # Pending verification
        classes_taking=user.classes_taking,
        classes_taken=user.classes_taken,
        learn_best_when=user.learn_best_when,
        study_snack=user.study_snack,
        favorite_study_spot=user.favorite_study_spot,
        mbti=user.mbti,
        yap_to_study_ratio=user.yap_to_study_ratio
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send verification email
    try:
        # Get base URL from request
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        await send_verification_email(
            user_email=db_user.school_email,
            user_name=db_user.name,
            user_major=db_user.major,
            user_academic_year=db_user.academic_year,
            user_id=db_user.id,
            base_url=base_url
        )
    except Exception as e:
        # Log the error but don't fail registration
        print(f"Failed to send verification email: {e}")
        # In production, you might want to use a proper logging system
    
    return db_user

@router.get("/user/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user profile by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/user/email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    """Get user profile by email"""
    user = db.query(User).filter(User.school_email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields that are provided
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.post("/user/{user_id}/verify-email", response_model=UserResponse)
def verify_email_manual(user_id: int, db: Session = Depends(get_db)):
    """Manually mark user's email as verified (for admin/testing purposes)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.email_verified = True
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/verify-email/{token}", response_model=EmailVerificationResponse)
def verify_email_token(token: str, db: Session = Depends(get_db)):
    """Verify user's email using token from email"""
    try:
        # Verify and decode token
        payload = verify_token(token)
        user_id = payload.get("user_id")
        action = payload.get("action")
        
        if action != "verify":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token action"
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Mark as verified
        user.email_verified = True
        db.commit()
        db.refresh(user)
        
        return EmailVerificationResponse(
            message="Email verified successfully! You can now use your Study Buddy account.",
            user=user
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/reject-email/{token}", response_model=EmailVerificationResponse)
def reject_email_token(token: str, db: Session = Depends(get_db)):
    """Reject email verification using token from email"""
    try:
        # Verify and decode token
        payload = verify_token(token)
        user_id = payload.get("user_id")
        action = payload.get("action")
        
        if action != "reject":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token action"
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Mark as rejected
        user.email_verified = False
        db.commit()
        db.refresh(user)
        
        return EmailVerificationResponse(
            message="Email verification rejected. This account has been marked as invalid.",
            user=user
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/users", response_model=UserListResponse)
def get_all_users(db: Session = Depends(get_db)):
    """Get all users (for testing purposes)"""
    users = db.query(User).all()
    return UserListResponse(users=users, total=len(users))
