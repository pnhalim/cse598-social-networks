from jose import jwt
from datetime import datetime, timedelta, timezone
import os
import secrets
import string
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.models import VerificationCode

# Import email config with error handling
try:
    from fastapi_mail import FastMail, MessageSchema
    from config.email_config import conf, email_settings
    # Secret key for JWT tokens (in production, use a secure random key)
    SECRET_KEY = email_settings.secret_key if email_settings else os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Error importing email config: {e}", exc_info=True)
    # Fallback values
    conf = None
    email_settings = None
    SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    FastMail = None
    MessageSchema = None

ALGORITHM = "HS256"

# Get frontend URL from environment variable, with fallbacks
# Check VITE_FRONTEND_BASE_URL first (common in Vite projects), then FRONTEND_BASE_URL
FRONTEND_BASE_URL = os.getenv("VITE_FRONTEND_BASE_URL") or os.getenv("FRONTEND_BASE_URL") or "https://studybuddyumich.vercel.app"

def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def generate_unique_verification_code(db: Session, max_attempts: int = 10) -> str:
    """Generate a unique verification code, retrying if collision occurs"""
    for attempt in range(max_attempts):
        code = generate_verification_code()
        # Check if code already exists
        existing = db.query(VerificationCode).filter(
            VerificationCode.code == code,
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.now(timezone.utc)
        ).first()
        if not existing:
            return code
    # If we've exhausted attempts, raise an error
    raise ValueError("Failed to generate unique verification code after multiple attempts")

def store_verification_code(db: Session, code: str, user_id: int, action: str) -> None:
    """Store verification code in database with expiration"""
    # Use timezone-aware datetime for consistency
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)  # 24 hour expiration
    
    try:
        db_code = VerificationCode(
            code=code,
            user_id=user_id,
            action=action,
            expires_at=expires_at
        )
        
        db.add(db_code)
        db.commit()
    except IntegrityError:
        # Code already exists (unique constraint violation)
        # This is rare but possible with 6-digit codes
        db.rollback()
        raise ValueError(f"Code collision detected. Please try again.")
    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to store verification code: {str(e)}")

def get_verification_code_data(db: Session, code: str, check_user_verified: bool = False) -> dict:
    """Get verification code data and mark as used (one-time use)
    
    Args:
        db: Database session
        code: Verification code
        check_user_verified: If True, check if user is already verified and return success even if code is used
    """
    try:
        # Use timezone-aware datetime for comparison
        now = datetime.now(timezone.utc)
        
        # First, try to find the code (check all codes, not just unused ones, for debugging)
        db_code = db.query(VerificationCode).filter(
            VerificationCode.code == code
        ).first()
        
        if not db_code:
            # Code doesn't exist at all
            print(f"DEBUG: Verification code '{code}' not found in database")
            return None
        
        # If code is already used, check if user is already verified (idempotent operation)
        if db_code.used:
            if check_user_verified:
                # Check if the user associated with this code is already verified
                from models.models import User
                user = db.query(User).filter(User.id == db_code.user_id).first()
                if user and user.email_verified:
                    print(f"DEBUG: Verification code '{code}' already used, but user {db_code.user_id} is already verified - returning success")
                    return {
                        "user_id": db_code.user_id,
                        "action": db_code.action,
                        "created_at": db_code.created_at,
                        "already_verified": True
                    }
            print(f"DEBUG: Verification code '{code}' has already been used")
            return None
        
        # Check if code is expired
        # Normalize expires_at to timezone-aware (SQLite may return naive datetimes)
        expires_at = db_code.expires_at
        if expires_at.tzinfo is None:
            # If timezone-naive, assume it's UTC
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at <= now:
            print(f"DEBUG: Verification code '{code}' has expired. Expires at: {expires_at}, Now: {now}")
            return None
        
        # Code is valid - mark as used
        db_code.used = True
        try:
            db.commit()
        except Exception as commit_error:
            db.rollback()
            print(f"ERROR: Failed to commit verification code usage: {commit_error}")
            raise ValueError(f"Database error while marking code as used: {str(commit_error)}")
        
        return {
            "user_id": db_code.user_id,
            "action": db_code.action,
            "created_at": db_code.created_at,
            "already_verified": False
        }
    except ValueError:
        # Re-raise ValueError so it can be handled upstream
        raise
    except Exception as e:
        # Catch any other database errors
        print(f"ERROR: Unexpected error in get_verification_code_data: {type(e).__name__}: {str(e)}")
        db.rollback()
        raise ValueError(f"Database error while verifying code: {str(e)}")

def create_verification_token(user_id: int, action: str) -> str:
    """Create a JWT token for email verification (no expiration)"""
    # Remove expiration - tokens will last forever
    to_encode = {
        "user_id": user_id,
        "action": action,  # "verify" or "reject"
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token (no expiration check)"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.JWTError:
        raise ValueError("Invalid token")

async def send_verification_email(user_email: str, user_name: str, user_major: str, user_academic_year: str, user_id: int, db: Session, base_url: str = "http://localhost:8001"):
    """Send verification email to user"""
    
    # Generate unique verification codes (with retry logic for collisions)
    verify_code = generate_unique_verification_code(db)
    reject_code = generate_unique_verification_code(db)
    
    # Invalidate old unused codes for this user to avoid confusion
    # Note: We use SQLAlchemy filter which handles timezone comparison at DB level
    now = datetime.now(timezone.utc)
    old_codes = db.query(VerificationCode).filter(
        VerificationCode.user_id == user_id,
        VerificationCode.used == False,
        VerificationCode.expires_at > now
    ).all()
    for old_code in old_codes:
        old_code.used = True  # Mark old codes as used
    if old_codes:
        db.commit()
    
    # Store new codes with user data in database
    try:
        store_verification_code(db, verify_code, user_id, "verify")
        store_verification_code(db, reject_code, user_id, "reject")
    except ValueError as e:
        # If storing fails, rollback the old code invalidation
        db.rollback()
        raise ValueError(f"Failed to create verification codes: {str(e)}")
    
    # Create JWT tokens for API responses (not for URLs)
    verify_token_str = create_verification_token(user_id, "verify")
    reject_token_str = create_verification_token(user_id, "reject")
    
    # Create URLs with short codes
    verification_url = f"{base_url}/api/verify-email/link/{verify_code}"
    rejection_url = f"{base_url}/api/reject-email/{reject_code}"
    
    # Email template variables
    template_vars = {
        "name": user_name,
        "email": user_email,
        "major": user_major,
        "academic_year": user_academic_year,
        "verification_url": verification_url,
        "rejection_url": rejection_url,
        "verification_code": verify_code  # Also include the code in the email
    }
    
    # Create message
    message = MessageSchema(
        subject="Verify Your Study Buddy Account",
        recipients=[user_email],
        template_body=template_vars,
        subtype="html"
    )
    
    # Send email
    fm = FastMail(conf)
    await fm.send_message(message, template_name="verification.html")
    
    return {
        "verification_code": verify_code,
        "rejection_code": reject_code,
        "verification_token": verify_token_str,
        "rejection_token": reject_token_str
    }

async def send_reach_out_email(
    sender: "User",
    recipient: "User",
    personal_message: str = None,
    db: Session = None
):
    """Send reach out email to recipient and CC sender"""
    from models.models import User
    
    # Helper function to get initials
    def get_initials(name: str) -> str:
        if not name:
            return "?"
        parts = name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return name[0].upper() if name else "?"
    
    # Prepare template variables
    template_vars = {
        "recipient_name": recipient.name or "Study Buddy",
        "recipient_email": recipient.school_email,
        "recipient_initials": get_initials(recipient.name),
        "recipient_major": recipient.major or "",
        "recipient_academic_year": recipient.academic_year or "",
        "recipient_gender": recipient.gender or "",
        "recipient_classes_taking": recipient.classes_taking or [],
        "sender_name": sender.name or "A Study Buddy",
        "sender_email": sender.school_email,
        "sender_initials": get_initials(sender.name),
        "sender_major": sender.major or "",
        "sender_academic_year": sender.academic_year or "",
        "sender_gender": sender.gender or "",
        "sender_classes_taking": sender.classes_taking or [],
        "sender_learn_best_when": sender.learn_best_when or "",
        "sender_study_snack": sender.study_snack or "",
        "sender_favorite_study_spot": sender.favorite_study_spot or "",
        "sender_mbti": sender.mbti or "",
        "sender_yap_to_study_ratio": sender.yap_to_study_ratio or "",
        "personal_message": personal_message or ""
    }
    
    # Create message - send to recipient, CC sender
    message = MessageSchema(
        subject=f"🎉 {sender.name or 'Someone'} Reached Out to Be Your Study Buddy!",
        recipients=[recipient.school_email],
        cc=[sender.school_email],
        template_body=template_vars,
        subtype="html"
    )
    
    # Send email
    fm = FastMail(conf)
    await fm.send_message(message, template_name="reach_out.html")
    
    return True

async def send_password_reset_email(user_email: str, user_name: str, user_id: int, db: Session, base_url: str = "http://localhost:8001"):
    reset_code = generate_verification_code()
    store_verification_code(db, reset_code, user_id, "reset")

    reset_url = f"{base_url}/api/reset-password/link/{reset_code}"

    # If you have a template, swap template_name + template_body.
    message = MessageSchema(
        subject="Reset your Study Buddy password",
        recipients=[user_email],
        subtype="html",
        body=f"""
        <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
          <p>Hi {user_name or "there"},</p>
          <p>We received a request to reset your password.</p>
          <p><a href="{reset_url}">Click here to reset your password</a></p>
          <p>If you didn’t request this, you can ignore this email.</p>
          <p>— Study Buddy</p>
        </div>
        """
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return True
