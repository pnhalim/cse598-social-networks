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
