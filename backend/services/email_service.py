from fastapi_mail import FastMail, MessageSchema
from config.email_config import conf, email_settings
from jose import jwt
from datetime import datetime, timedelta
import os
import secrets
import string
from sqlalchemy.orm import Session
from models.models import VerificationCode

# Secret key for JWT tokens (in production, use a secure random key)
SECRET_KEY = email_settings.secret_key
ALGORITHM = "HS256"

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def store_verification_code(db: Session, code: str, user_id: int, action: str) -> None:
    """Store verification code in database with expiration"""
    expires_at = datetime.utcnow() + timedelta(hours=24)  # 24 hour expiration
    
    db_code = VerificationCode(
        code=code,
        user_id=user_id,
        action=action,
        expires_at=expires_at
    )
    
    db.add(db_code)
    db.commit()

def get_verification_code_data(db: Session, code: str) -> dict:
    """Get verification code data and mark as used (one-time use)"""
    db_code = db.query(VerificationCode).filter(
        VerificationCode.code == code,
        VerificationCode.used == False,
        VerificationCode.expires_at > datetime.utcnow()
    ).first()
    
    if db_code:
        # Mark as used
        db_code.used = True
        db.commit()
        
        return {
            "user_id": db_code.user_id,
            "action": db_code.action,
            "created_at": db_code.created_at
        }
    
    return None

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
    
    # Generate short verification codes
    verify_code = generate_verification_code()
    reject_code = generate_verification_code()
    
    # Store codes with user data in database
    store_verification_code(db, verify_code, user_id, "verify")
    store_verification_code(db, reject_code, user_id, "reject")
    
    # Create JWT tokens for API responses (not for URLs)
    verify_token_str = create_verification_token(user_id, "verify")
    reject_token_str = create_verification_token(user_id, "reject")
    
    # Create URLs with short codes
    verification_url = f"{FRONTEND_BASE_URL}/verify-email/{verify_code}"
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
