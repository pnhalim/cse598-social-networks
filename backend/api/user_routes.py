from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.models import User, UserReport
from models.schemas import (
    UserCreate, UserUpdate, UserResponse, UserListResponse, MessageResponse,
    FilterOptionsResponse, PreferencesUpdate, ReachOutRequest, ReachOutResponse,
    ReportRequest, ReportResponse
)
from services.utils import assign_frontend_design
from services.image_service import image_service
from services.email_service import send_reach_out_email
from config.auth_dependencies import get_current_user, get_current_active_user

# Create router for user management routes
router = APIRouter(prefix="/api", tags=["users"])

# Get current user profile
@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's profile"""
    return current_user

# Get user profile by ID (users can only access their own profile)
@router.get("/user/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile by ID (users can only access their own profile)"""
    # Users can only access their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own profile"
        )
    
    return current_user

# Update current user's profile (no user_id path param)
@router.put("/user/update", response_model=UserResponse)
def update_user(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update the authenticated user's profile"""
    # Update fields that are provided
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Update current user's preferences (no user_id path param)
@router.put("/user/preferences", response_model=UserResponse)
def update_preferences(prefs: PreferencesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update the authenticated user's match preference flags"""
    # Update preference flags
    if prefs.match_by_gender is not None:
        current_user.match_by_gender = prefs.match_by_gender
    if prefs.match_by_major is not None:
        current_user.match_by_major = prefs.match_by_major
    if prefs.match_by_academic_year is not None:
        current_user.match_by_academic_year = prefs.match_by_academic_year
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Get filter options for matching
@router.get("/filters/options", response_model=FilterOptionsResponse)
def get_filter_options(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get available filter options for user matching"""
    # Get all users to extract unique values
    users = db.query(User).filter(User.profile_completed == True).all()
    
    # Extract unique genders
    genders = list(set(user.gender for user in users if user.gender))
    
    # Extract unique majors
    majors = list(set(user.major for user in users if user.major))
    
    return FilterOptionsResponse(
        genders=sorted(genders),
        majors=sorted(majors)
    )

# Legacy endpoint for backward compatibility (if needed)
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Legacy registration endpoint (for backward compatibility)"""
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
    
    # Note: This legacy endpoint doesn't send verification email
    # Use the new authentication flow instead
    
    return db_user

# Manual email verification endpoint (for admin/testing purposes)
@router.post("/user/{user_id}/verify-email", response_model=UserResponse)
def verify_email_manual(user_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Manually mark user's email as verified (for admin/testing purposes)"""
    # Only allow users to verify their own email
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only verify your own email"
        )
    
    current_user.email_verified = True
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Upload profile picture
@router.post("/user/{user_id}/profile-picture", response_model=UserResponse)
async def upload_profile_picture(
    user_id: int, 
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Upload a profile picture for the user"""
    # Users can only upload their own profile picture
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload your own profile picture"
        )
    
    try:
        # Upload image to Cloudinary
        image_url = await image_service.upload_profile_picture(file, user_id)
        
        # Update user's profile picture URL
        current_user.profile_picture = image_url
        db.commit()
        db.refresh(current_user)
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )

# Delete profile picture
@router.delete("/user/{user_id}/profile-picture", response_model=UserResponse)
def delete_profile_picture(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete the user's profile picture"""
    # Users can only delete their own profile picture
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own profile picture"
        )
    
    # Clear the profile picture URL
    current_user.profile_picture = None
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Send reach out email
@router.post("/reach-out", response_model=ReachOutResponse, status_code=status.HTTP_200_OK)
async def send_reach_out(
    reach_out_request: ReachOutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a reach out email to another user"""
    # Check if recipient exists
    recipient = db.query(User).filter(User.id == reach_out_request.recipient_user_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient user not found"
        )
    
    # Check if recipient has verified email
    if not recipient.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient's email is not verified"
        )
    
    # Check if sender has verified email
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your email must be verified to send reach out emails"
        )
    
    # Don't allow reaching out to yourself
    if current_user.id == reach_out_request.recipient_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot reach out to yourself"
        )
    
    try:
        # Send the email
        await send_reach_out_email(
            sender=current_user,
            recipient=recipient,
            personal_message=reach_out_request.personal_message,
            db=db
        )
        
        return ReachOutResponse(
            message=f"Reach out email sent successfully to {recipient.name or recipient.school_email}!",
            email_sent=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

# Report a user
@router.post("/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def report_user(
    report_request: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Report a user for inappropriate behavior"""
    # Check if reported user exists
    reported_user = db.query(User).filter(User.id == report_request.reported_user_id).first()
    if not reported_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reported user not found"
        )
    
    # Don't allow reporting yourself
    if current_user.id == report_request.reported_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report yourself"
        )
    
    # Create the report
    report = UserReport(
        reporter_id=current_user.id,
        reported_user_id=report_request.reported_user_id,
        reason=report_request.reason,
        context=report_request.context
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return ReportResponse(
        message=f"Report submitted successfully. Thank you for helping keep Study Buddy safe.",
        report_id=report.id
    )
