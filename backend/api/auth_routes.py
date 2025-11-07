from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User
from models.schemas import (
    EmailRequest, EmailRequestResponse, PasswordSetup, PasswordSetupResponse, 
    ProfileSetup, ProfileSetupResponse, LoginRequest, LoginResponse
)
from services.utils import assign_frontend_design
from services.email_service import send_verification_email, send_password_reset_email, verify_token, get_verification_code_data, create_verification_token, FRONTEND_BASE_URL
from services.auth_utils import hash_password, verify_password, create_access_token
from services.censorship_service import validate_text_input

# Create router for authentication routes
router = APIRouter(prefix="/api", tags=["authentication"])

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
            db=db,
            base_url=base_url
        )
        
        return EmailRequestResponse(
            message="Verification email sent successfully. Please check your email to continue.",
            email_sent=True
        )
    except ValueError as e:
        # Handle code generation/storage errors
        # If email fails, delete the user record
        db.delete(db_user)
        db.commit()
        print(f"Failed to generate/store verification code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create verification code: {str(e)}. Please try again."
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

# Resend verification email for unverified users
@router.post("/resend-verification", response_model=EmailRequestResponse, status_code=status.HTTP_200_OK)
async def resend_verification_email(email_request: EmailRequest, request: Request, db: Session = Depends(get_db)):
    """Resend verification email for users who haven't completed setup"""
    
    # Check if user exists
    existing_user = db.query(User).filter(User.school_email == email_request.school_email).first()
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address"
        )
    
    # Check if user has a password (means they completed the flow)
    if existing_user.password_hash is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account setup is already complete. Please log in instead."
        )
    
    # Allow resending even if email is verified, as long as password isn't set
    # This helps users who verified but lost the email or need a new code
    
    # Send new verification email
    try:
        # Get base URL from request
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        await send_verification_email(
            user_email=existing_user.school_email,
            user_name="User",  # Placeholder name since we don't have it yet
            user_major="",  # Placeholder
            user_academic_year="",  # Placeholder
            user_id=existing_user.id,
            db=db,
            base_url=base_url
        )
        
        return EmailRequestResponse(
            message="New verification email sent successfully. Please check your email to continue.",
            email_sent=True
        )
    except ValueError as e:
        # Handle code generation/storage errors
        print(f"Failed to generate/store verification code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create verification code: {str(e)}. Please try again."
        )
    except Exception as e:
        print(f"Failed to resend verification email: {e}")
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
        
        # Create access token for automatic login
        access_token = create_access_token(data={"user_id": user.id})
        
        return PasswordSetupResponse(
            message="Password set successfully. You are now logged in!",
            user_id=user.id,
            access_token=access_token
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
    
    # Validate text fields for inappropriate content
    text_fields = {
        'name': profile_data.name,
        'major': profile_data.major,
        'learn_best_when': profile_data.learn_best_when,
        'study_snack': profile_data.study_snack,
        'favorite_study_spot': profile_data.favorite_study_spot,
        'mbti': profile_data.mbti
    }
    
    for field_name, field_value in text_fields.items():
        if field_value:
            is_valid, error_msg = validate_text_input(field_value, field_name.replace('_', ' ').title())
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg
                )
    
    # Validate class names
    if profile_data.classes_taking:
        for class_name in profile_data.classes_taking:
            if class_name:
                is_valid, error_msg = validate_text_input(class_name, 'Class name')
                if not is_valid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_msg
                    )
    
    if profile_data.classes_taken:
        for class_name in profile_data.classes_taken:
            if class_name:
                is_valid, error_msg = validate_text_input(class_name, 'Class name')
                if not is_valid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_msg
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

# Login endpoint (JSON format)
@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user with email and password (JSON format)"""
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

# Exchange verification code for JWT token
@router.post("/verify-code/{code}")
def exchange_verification_code(code: str, db: Session = Depends(get_db)):
    """Exchange verification code for JWT token"""
    try:
        # Normalize code (strip whitespace, ensure it's a string)
        code = str(code).strip()
        print(f"DEBUG: Attempting to verify code: '{code}'")
        
        # Get code data (this marks the code as used - one-time use)
        # Pass check_user_verified=True to make this idempotent (handle duplicate requests)
        try:
            code_data = get_verification_code_data(db, code, check_user_verified=True)
        except ValueError as ve:
            # Database error during code verification
            print(f"ERROR: ValueError in get_verification_code_data: {ve}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while verifying code: {str(ve)}"
            )
        
        if not code_data:
            print(f"DEBUG: Code '{code}' validation failed - returning 400")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code. Please check that you're using the correct code from your email."
            )
        
        user_id = code_data["user_id"]
        action = code_data["action"]
        already_verified = code_data.get("already_verified", False)
        
        print(f"DEBUG: Code validated successfully for user_id={user_id}, action={action}, already_verified={already_verified}")
        
        if action != "verify":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid code action"
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Only mark as verified if not already verified (idempotent operation)
        if not already_verified and not user.email_verified:
            user.email_verified = True
            try:
                db.commit()
                db.refresh(user)
            except Exception as commit_error:
                db.rollback()
                print(f"ERROR: Failed to commit email verification: {commit_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error while updating user: {str(commit_error)}"
                )
        elif already_verified:
            print(f"DEBUG: User {user_id} already verified - skipping verification step")
        
        # Create JWT token for the user
        jwt_token = create_verification_token(user_id, "verify")
        
        print(f"DEBUG: Email verification successful for user_id={user_id}")
        
        return {
            "message": "Email verified successfully! Please set your password to continue.",
            "user": user,
            "token": jwt_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Unexpected exception in exchange_verification_code: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify code: {str(e)}"
        )

# Email verification endpoints (legacy - keeping for backward compatibility)
@router.get("/verify-email/{token}")
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
        
        return {
            "message": "Email verified successfully! Please set your password to continue.",
            "user": user
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/reject-email/{token}")
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
        
        return {
            "message": "Email verification rejected. This account has been deleted from our system.",
            "user": user_info
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
# NEW: request password reset
@router.post("/request-password-reset", response_model=EmailRequestResponse, status_code=status.HTTP_200_OK)
async def request_password_reset(email_request: EmailRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.school_email == email_request.school_email).first()
    if not user:
        # Don’t leak which emails exist
        return EmailRequestResponse(message="If an account exists, you'll receive a reset email shortly.", email_sent=True)

    if user.email_verified is not True:
        raise HTTPException(status_code=400, detail="Email not verified yet. Please verify first.")

    # send reset email (short code flow)
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    try:
        await send_password_reset_email(user_email=user.school_email, user_name=user.name or "Study Buddy",
                                        user_id=user.id, db=db, base_url=base_url)
        return EmailRequestResponse(message="If an account exists, you'll receive a reset email shortly.", email_sent=True)
    except Exception as e:
        print("Failed to send password reset:", e)
        raise HTTPException(status_code=500, detail="Failed to send password reset email.")

# NEW: complete password reset using the short code from email
@router.post("/reset-password/{code}", response_model=PasswordSetupResponse, status_code=status.HTTP_200_OK)
def reset_password(code: str, password_data: PasswordSetup, db: Session = Depends(get_db)):
    code_data = get_verification_code_data(db, code)  # validates/marks used
    if not code_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if code_data["action"] != "reset":
        raise HTTPException(status_code=400, detail="Invalid code action")

    user = db.query(User).filter(User.id == code_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified is not True:
        raise HTTPException(status_code=400, detail="Email not verified yet")

    # update password
    user.password_hash = hash_password(password_data.password)
    db.commit()

    access_token = create_access_token(data={"user_id": user.id})
    return PasswordSetupResponse(
        message="Password reset successfully. You are now logged in!",
        user_id=user.id,
        access_token=access_token
    )

@router.get("/verify-email/link/{code}", include_in_schema=False)
def redirect_verify_email_link(code: str):
    frontend_url = f"{FRONTEND_BASE_URL}/verify-email/{code}"
    return RedirectResponse(url=frontend_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

@router.get("/reset-password/link/{code}", include_in_schema=False)
def redirect_reset_password_link(code: str):
    frontend_url = f"{FRONTEND_BASE_URL}/reset-password/{code}"
    return RedirectResponse(url=frontend_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
