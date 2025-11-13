from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime, date
from core.database import get_db

from models.models import User, UserReport, ReachOut, StudySessionRating, UserNote, SurveyResponse
from models.schemas import (
    UserCreate, UserUpdate, UserResponse, UserListResponse, MessageResponse,
    FilterOptionsResponse, PreferencesUpdate, ReachOutRequest, ReachOutResponse,
    ReportRequest, ReportResponse, ReachOutStatusResponse,
    ConnectionsResponse, ConnectionInfo, MarkMetRequest, MarkMetResponse,
    RatingCriteriaResponse, SubmitRatingRequest, SubmitRatingResponse,
    UserNotesResponse, UserNoteResponse, SurveySubmission, SurveySubmissionResponse
)
from services.reputation_service import get_random_criteria, update_user_reputation
from services.utils import assign_frontend_design
from services.image_service import image_service
from services.email_service import send_reach_out_email
from services.censorship_service import validate_text_input
from config.auth_dependencies import get_current_user, get_current_active_user

# Create router for user management routes
router = APIRouter(prefix="/api", tags=["users"])

# Daily reach out limit
DAILY_REACH_OUT_LIMIT = 5

def get_today_reach_out_count(db: Session, user_id: int) -> int:
    """Get the count of reach outs sent by a user today"""
    today_start = datetime.combine(date.today(), datetime.min.time())
    count = db.query(ReachOut).filter(
        and_(
            ReachOut.sender_id == user_id,
            ReachOut.created_at >= today_start
        )
    ).count()
    return count

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
    
    # Validate text fields for inappropriate content
    text_fields = ['name', 'major', 'learn_best_when', 'study_snack', 'favorite_study_spot', 'mbti']
    for field_name in text_fields:
        if field_name in update_data and update_data[field_name]:
            is_valid, error_msg = validate_text_input(update_data[field_name], field_name.replace('_', ' ').title())
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg
                )
    
    # Validate class names if provided
    if 'classes_taking' in update_data and update_data['classes_taking']:
        for class_name in update_data['classes_taking']:
            if class_name:
                is_valid, error_msg = validate_text_input(class_name, 'Class name')
                if not is_valid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_msg
                    )
    
    if 'classes_taken' in update_data and update_data['classes_taken']:
        for class_name in update_data['classes_taken']:
            if class_name:
                is_valid, error_msg = validate_text_input(class_name, 'Class name')
                if not is_valid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_msg
                    )
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Submit survey responses
@router.post("/survey/submit", response_model=SurveySubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_survey(
    survey: SurveySubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit survey responses. User must have completed profile first."""
    # User must have completed profile first
    if not current_user.profile_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first"
        )
    
    # Check if survey already exists
    existing_survey = db.query(SurveyResponse).filter(
        SurveyResponse.user_id == current_user.id
    ).first()
    
    if existing_survey:
        # Update existing survey
        for field, value in survey.dict().items():
            setattr(existing_survey, field, value)
    else:
        # Create new survey response
        survey_data = survey.dict()
        survey_data['user_id'] = current_user.id
        new_survey = SurveyResponse(**survey_data)
        db.add(new_survey)
    
    # Mark survey as completed
    current_user.survey_completed = True
    
    db.commit()
    
    return SurveySubmissionResponse(
        message="Survey submitted successfully",
        survey_completed=True
    )

# Complete onboarding with preferences
@router.post("/onboarding/complete", response_model=UserResponse)
def complete_onboarding(prefs: PreferencesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Complete onboarding by setting user preferences"""
    # User must have completed profile first
    if not current_user.profile_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first"
        )
    
    # User must have completed survey first
    if not current_user.survey_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete the survey first"
        )
    
    # Update preference flags
    if prefs.match_by_gender is not None:
        current_user.match_by_gender = prefs.match_by_gender
    if prefs.match_by_major is not None:
        current_user.match_by_major = prefs.match_by_major
    if prefs.match_by_academic_year is not None:
        current_user.match_by_academic_year = prefs.match_by_academic_year
    if prefs.match_by_study_preferences is not None:
        current_user.match_by_study_preferences = prefs.match_by_study_preferences
    if prefs.match_by_classes is not None:
        current_user.match_by_classes = prefs.match_by_classes
    
    # Mark onboarding as completed
    current_user.onboarding_completed = True
    
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
    if prefs.match_by_study_preferences is not None:
        current_user.match_by_study_preferences = prefs.match_by_study_preferences
    if prefs.match_by_classes is not None:
        current_user.match_by_classes = prefs.match_by_classes
    
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
    
    # Check daily reach out limit
    today_count = get_today_reach_out_count(db, current_user.id)
    if today_count >= DAILY_REACH_OUT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You have reached your daily limit of {DAILY_REACH_OUT_LIMIT} reach outs. Please try again tomorrow."
        )
    
    # Validate personal message for inappropriate content
    if reach_out_request.personal_message:
        is_valid, error_msg = validate_text_input(reach_out_request.personal_message, 'Message')
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
    
    try:
        # Send the email
        await send_reach_out_email(
            sender=current_user,
            recipient=recipient,
            personal_message=reach_out_request.personal_message,
            db=db
        )
        
        # Track the reach out in database
        reach_out_record = ReachOut(
            sender_id=current_user.id,
            recipient_id=recipient.id,
            personal_message=reach_out_request.personal_message
        )
        db.add(reach_out_record)
        db.commit()
        
        # Get updated count
        updated_count = get_today_reach_out_count(db, current_user.id)
        remaining = DAILY_REACH_OUT_LIMIT - updated_count
        
        return ReachOutResponse(
            message=f"Reach out email sent successfully to {recipient.name or recipient.school_email}!",
            email_sent=True,
            remaining_reach_outs=remaining
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

# Get reach out status for current user
@router.get("/reach-out/status", response_model=ReachOutStatusResponse)
def get_reach_out_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's reach out status for today"""
    today_count = get_today_reach_out_count(db, current_user.id)
    remaining = DAILY_REACH_OUT_LIMIT - today_count
    can_reach_out = remaining > 0
    
    return ReachOutStatusResponse(
        today_count=today_count,
        daily_limit=DAILY_REACH_OUT_LIMIT,
        remaining=remaining,
        can_reach_out=can_reach_out
    )

# Reputation system endpoints

# Get connections (users reached out to and reached out by)
@router.get("/connections", response_model=ConnectionsResponse)
def get_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users the current user has reached out to and who have reached out to them"""
    # Get users reached out to (where current_user is sender)
    reached_out_to_records = db.query(ReachOut).filter(
        ReachOut.sender_id == current_user.id
    ).all()
    
    # Get users who reached out (where current_user is recipient)
    reached_out_by_records = db.query(ReachOut).filter(
        ReachOut.recipient_id == current_user.id
    ).all()
    
    # Check which connections have ratings
    rating_reach_out_ids = set(
        db.query(StudySessionRating.reach_out_id).filter(
            StudySessionRating.rater_id == current_user.id
        ).all()
    )
    rating_reach_out_ids = {r[0] for r in rating_reach_out_ids}
    
    def build_connection_info(reach_out: ReachOut, other_user: User) -> ConnectionInfo:
        return ConnectionInfo(
            id=reach_out.id,
            user_id=other_user.id,
            name=other_user.name,
            school_email=other_user.school_email,
            profile_picture=other_user.profile_picture,
            reach_out_id=reach_out.id,
            created_at=reach_out.created_at,
            met=reach_out.met,
            has_rating=reach_out.id in rating_reach_out_ids
        )
    
    reached_out_to = [
        build_connection_info(ro, ro.recipient)
        for ro in reached_out_to_records
    ]
    
    reached_out_by = [
        build_connection_info(ro, ro.sender)
        for ro in reached_out_by_records
    ]
    
    return ConnectionsResponse(
        reached_out_to=reached_out_to,
        reached_out_by=reached_out_by
    )

# Mark connection as met or not met
@router.post("/connections/mark-met", response_model=MarkMetResponse)
def mark_connection_met(
    request: MarkMetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark whether a connection actually met or not"""
    reach_out = db.query(ReachOut).filter(
        ReachOut.id == request.reach_out_id
    ).first()
    
    if not reach_out:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Verify the current user is part of this connection
    if reach_out.sender_id != current_user.id and reach_out.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark your own connections"
        )
    
    reach_out.met = request.met
    db.commit()
    
    return MarkMetResponse(
        message="Connection status updated successfully",
        reach_out_id=reach_out.id
    )

# Get rating criteria for a connection
@router.get("/connections/{reach_out_id}/rating-criteria", response_model=RatingCriteriaResponse)
def get_rating_criteria(
    reach_out_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 3 randomly selected rating criteria for a connection"""
    reach_out = db.query(ReachOut).filter(ReachOut.id == reach_out_id).first()
    
    if not reach_out:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Verify the current user is part of this connection
    if reach_out.sender_id != current_user.id and reach_out.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only rate your own connections"
        )
    
    # Check if already rated
    existing_rating = db.query(StudySessionRating).filter(
        and_(
            StudySessionRating.reach_out_id == reach_out_id,
            StudySessionRating.rater_id == current_user.id
        )
    ).first()
    
    if existing_rating:
        # Return the criteria that were used
        return RatingCriteriaResponse(
            criteria=[existing_rating.criterion_1, existing_rating.criterion_2, existing_rating.criterion_3]
        )
    
    # Get 3 random criteria
    criteria = get_random_criteria()
    
    return RatingCriteriaResponse(criteria=criteria)

# Submit rating for a study session
@router.post("/connections/rate", response_model=SubmitRatingResponse)
def submit_rating(
    request: SubmitRatingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a rating for a study session"""
    reach_out = db.query(ReachOut).filter(ReachOut.id == request.reach_out_id).first()
    
    if not reach_out:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Verify the current user is part of this connection
    if reach_out.sender_id != current_user.id and reach_out.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only rate your own connections"
        )
    
    # Check if already rated
    existing_rating = db.query(StudySessionRating).filter(
        and_(
            StudySessionRating.reach_out_id == request.reach_out_id,
            StudySessionRating.rater_id == current_user.id
        )
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this connection"
        )
    
    # Determine which user is being rated (the other user in the connection)
    if reach_out.sender_id == current_user.id:
        rated_user_id = reach_out.recipient_id
    else:
        rated_user_id = reach_out.sender_id
    
    # Create rating
    rating = StudySessionRating(
        rater_id=current_user.id,
        rated_user_id=rated_user_id,
        reach_out_id=request.reach_out_id,
        criterion_1=request.criterion_1,
        rating_1=request.rating_1,
        criterion_2=request.criterion_2,
        rating_2=request.rating_2,
        criterion_3=request.criterion_3,
        rating_3=request.rating_3,
        reflection_note=request.reflection_note
    )
    
    db.add(rating)
    db.commit()
    db.refresh(rating)
    
    # Update reputation of the rated user
    update_user_reputation(
        db,
        rated_user_id,
        request.rating_1,
        request.rating_2,
        request.rating_3
    )
    
    # Save reflection note if provided
    if request.reflection_note:
        note = UserNote(
            user_id=current_user.id,
            note_text=request.reflection_note
        )
        db.add(note)
        db.commit()
    
    return SubmitRatingResponse(
        message="Rating submitted successfully",
        rating_id=rating.id
    )

# Get user's personal notes (reflection notes)
@router.get("/notes", response_model=UserNotesResponse)
def get_user_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's personal reflection notes"""
    notes = db.query(UserNote).filter(
        UserNote.user_id == current_user.id
    ).order_by(UserNote.created_at.desc()).all()
    
    note_responses = [
        UserNoteResponse(
            id=note.id,
            note_text=note.note_text,
            created_at=note.created_at
        )
        for note in notes
    ]
    
    return UserNotesResponse(
        notes=note_responses,
        total=len(note_responses)
    )
