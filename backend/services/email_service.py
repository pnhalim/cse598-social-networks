from fastapi_mail import FastMail, MessageSchema
from config.email_config import conf, email_settings
from jose import jwt
from datetime import datetime, timedelta
import os

# Secret key for JWT tokens (in production, use a secure random key)
SECRET_KEY = email_settings.secret_key
ALGORITHM = "HS256"

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

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

async def send_verification_email(user_email: str, user_name: str, user_major: str, user_academic_year: str, user_id: int, base_url: str = "http://localhost:8001"):
    """Send verification email to user"""
    
    # Create verification and rejection tokens
    verify_token_str = create_verification_token(user_id, "verify")
    reject_token_str = create_verification_token(user_id, "reject")
    
    # Create URLs
    verification_url = f"{FRONTEND_BASE_URL}/verify-email/{verify_token_str}"
    rejection_url = f"{base_url}/api/reject-email/{reject_token_str}"
    
    # Email template variables
    template_vars = {
        "name": user_name,
        "email": user_email,
        "major": user_major,
        "academic_year": user_academic_year,
        "verification_url": verification_url,
        "rejection_url": rejection_url
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
        "verification_token": verify_token_str,
        "rejection_token": reject_token_str
    }
