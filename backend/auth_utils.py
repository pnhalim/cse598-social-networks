"""
Authentication utilities for password hashing and verification
"""

import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Ensure password is a string
    if not isinstance(password, str):
        password = str(password)
    
    # Convert to bytes for bcrypt
    password_bytes = password.encode('utf-8')
    
    # bcrypt has a 72-byte limit, so we truncate if necessary
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False
