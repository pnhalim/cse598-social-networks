from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.models import User
from models.schemas import (
    UserCreate, UserUpdate, UserResponse, UserListResponse, MessageResponse, 
    EmailVerificationResponse, EmailSentResponse, EmailRequest, EmailRequestResponse,
    PasswordSetup, PasswordSetupResponse, ProfileSetup, ProfileSetupResponse,
    FilterOptionsResponse, PreferencesUpdate, LoginRequest, LoginResponse
)
from services.utils import assign_frontend_design
from services.email_service import send_verification_email, verify_token
from services.auth_utils import hash_password, verify_password, create_access_token
from config.auth_dependencies import get_current_user, get_current_active_user

# Create router for user routes
router = APIRouter(prefix="/api", tags=["users"])

# Step 1: Request email verification
@router.post("/request-verification", response_model=EmailRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_email_verification(email_request: EmailRequest, request: Request, db: Session = Depends(get_db)):
    """Step 1: Submit email and send verification email"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.school_email == email_request.school_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create new user with only email (other fields will be filled later)
    db_user = User(
        school_email=email_request.school_email,
        email_verified=None,  # Pending verification
        profile_completed=False
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
            user_name="User",  # Placeholder name since we don't have it yet
            user_major="",  # Placeholder
            user_academic_year="",  # Placeholder
            user_id=db_user.id,
            base_url=base_url
        )
        
        return EmailRequestResponse(
            message="Verification email sent successfully. Please check your email to continue.",
            email_sent=True
        )
    except Exception as e:
        # If email fails, delete the user record
        db.delete(db_user)
        db.commit()
        print(f"Failed to send verification email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again."
        )

# Step 2: Setup password after email verification
@router.post("/setup-password/{token}", response_model=PasswordSetupResponse, status_code=status.HTTP_200_OK)
def setup_password(token: str, password_data: PasswordSetup, db: Session = Depends(get_db)):
    """Step 2: Set password after email verification"""
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
        
        if user.email_verified is not True:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not verified yet"
            )
        
        if user.password_hash is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password already set for this user"
            )
        
        # Hash and store password
        user.password_hash = hash_password(password_data.password)
        db.commit()
        
        return PasswordSetupResponse(
            message="Password set successfully. You can now complete your profile.",
            user_id=user.id
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Step 3: Complete profile setup
@router.post("/complete-profile/{user_id}", response_model=ProfileSetupResponse, status_code=status.HTTP_200_OK)
def complete_profile(user_id: int, profile_data: ProfileSetup, db: Session = Depends(get_db)):
    """Step 3: Complete profile setup"""
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not verified yet"
        )
    
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password not set yet"
        )
    
    if user.profile_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already completed"
        )
    
    # Update user with profile data
    user.name = profile_data.name
    user.gender = profile_data.gender
    user.major = profile_data.major
    user.academic_year = profile_data.academic_year
    user.profile_picture = profile_data.profile_picture
    user.classes_taking = profile_data.classes_taking
    user.classes_taken = profile_data.classes_taken
    user.learn_best_when = profile_data.learn_best_when
    user.study_snack = profile_data.study_snack
    user.favorite_study_spot = profile_data.favorite_study_spot
    user.mbti = profile_data.mbti
    user.yap_to_study_ratio = profile_data.yap_to_study_ratio
    user.frontend_design = assign_frontend_design()  # Assign A/B test design
    user.profile_completed = True
    
    db.commit()
    db.refresh(user)
    
    return ProfileSetupResponse(
        message="Profile completed successfully! Welcome to Study Buddy.",
        user=user
    )

# Login endpoint
@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user with email and password (OAuth2PasswordBearer compatible)"""
    # Find user by email
    user = db.query(User).filter(User.school_email == login_data.school_email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if email is verified
    if user.email_verified is not True:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified. Please check your email and verify your account."
        )
    
    # Check if password is set
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password not set. Please complete your registration."
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"user_id": user.id})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

# OAuth2 form-based login endpoint (for OAuth2 standard compliance)
@router.post("/token", status_code=status.HTTP_200_OK)
def login_for_access_token(
    username: str = Form(...),  # OAuth2 uses 'username' field
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """OAuth2 standard form-based login endpoint"""
    try:
        # Find user by email (username in OAuth2 context)
        user = db.query(User).filter(User.school_email == username).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if email is verified
        if user.email_verified is not True:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified. Please check your email and verify your account."
            )
        
        # Check if password is set
        if user.password_hash is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password not set. Please complete your registration."
            )
        
        # Verify password
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token = create_access_token(data={"user_id": user.id})
        
        # Return standard OAuth2 response format
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /api/token endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )

# Get current user profile
@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's profile"""
    return current_user

# Legacy endpoint for backward compatibility
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
def get_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile by ID (users can only access their own profile)"""
    # Users can only access their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own profile"
        )
    
    return current_user

@router.get("/user/email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile by email (users can only access their own profile)"""
    # Users can only access their own profile
    if current_user.school_email != email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own profile"
        )
    
    return current_user

@router.put("/user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user profile (users can only update their own profile)"""
    # Users can only update their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Update fields that are provided
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.put("/user/{user_id}/preferences", response_model=UserResponse)
def update_preferences(user_id: int, prefs: PreferencesUpdate, db: Session = Depends(get_db)):
    """Update user's match preference flags."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = prefs.dict(exclude_unset=True)
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
            message="Email verified successfully! Please set your password to continue.",
            user=user
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/reject-email/{token}", response_model=EmailVerificationResponse)
def reject_email_token(token: str, db: Session = Depends(get_db)):
    """Reject email verification and delete user from database"""
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
        
        # Store user info for response before deletion
        user_info = {
            "id": user.id,
            "name": user.name,
            "school_email": user.school_email,
            "major": user.major,
            "academic_year": user.academic_year,
            "gender": user.gender,
            "profile_picture": user.profile_picture,
            "frontend_design": user.frontend_design,
            "email_verified": user.email_verified,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "classes_taking": user.classes_taking,
            "classes_taken": user.classes_taken,
            "learn_best_when": user.learn_best_when,
            "study_snack": user.study_snack,
            "favorite_study_spot": user.favorite_study_spot,
            "mbti": user.mbti,
            "yap_to_study_ratio": user.yap_to_study_ratio
        }
        
        # Delete user from database
        db.delete(user)
        db.commit()
        
        return EmailVerificationResponse(
            message="Email verification rejected. This account has been deleted from our system.",
            user=user_info
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/users", response_model=UserListResponse)
def get_all_users(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get all users (for testing purposes)"""
    users = db.query(User).all()
    return UserListResponse(users=users, total=len(users))

@router.get("/filters/options", response_model=FilterOptionsResponse)
def get_filter_options(db: Session = Depends(get_db)):
    """Get distinct values for gender, major, and academic_year from users."""
    genders = [row[0] for row in db.query(User.gender).filter(User.gender.isnot(None)).distinct().all()]
    majors = [row[0] for row in db.query(User.major).filter(User.major.isnot(None)).distinct().all()]
    academic_years = [row[0] for row in db.query(User.academic_year).filter(User.academic_year.isnot(None)).distinct().all()]
    return FilterOptionsResponse(genders=genders, majors=majors, academic_years=academic_years)

@router.get("/users/filter", response_model=UserListResponse)
def filter_users(
    user_id: int | None = None,
    gender: str | None = None,
    major: str | None = None,
    academic_year: str | None = None,
    db: Session = Depends(get_db)
):
    """Return users filtered by selected attributes.
    - If user_id is provided, use that user's saved preferences to decide which fields to match.
    - If explicit gender/major/academic_year params are provided, they act as additional constraints.
    """
    query = db.query(User)

    base_user = None
    if user_id is not None:
        base_user = db.query(User).filter(User.id == user_id).first()
        if not base_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        query = query.filter(User.id != user_id)
        # Apply saved preferences as constraints
        if getattr(base_user, "match_by_gender", False) and base_user.gender:
            query = query.filter(User.gender == base_user.gender)
        if getattr(base_user, "match_by_major", False) and base_user.major:
            query = query.filter(User.major == base_user.major)
        if getattr(base_user, "match_by_academic_year", False) and base_user.academic_year:
            query = query.filter(User.academic_year == base_user.academic_year)

    # Apply any explicit constraints provided
    if gender:
        query = query.filter(User.gender == gender)
    if major:
        query = query.filter(User.major == major)
    if academic_year:
        query = query.filter(User.academic_year == academic_year)

    users = query.all()
    return UserListResponse(users=users, total=len(users))