from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
from typing import Optional

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    school_email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Will be set after email verification
    name = Column(String(100), nullable=True)  # Made optional for step-by-step registration
    gender = Column(String(20), nullable=True)  # Made optional for step-by-step registration
    major = Column(String(100), nullable=True)  # Made optional for step-by-step registration
    profile_picture = Column(String(255), nullable=True)  # URL or file path
    academic_year = Column(String(20), nullable=True)  # Made optional for step-by-step registration
    frontend_design = Column(String(20), nullable=True)  # 'design1' or 'design2' - assigned after profile completion
    email_verified = Column(Boolean, nullable=True)  # None=pending, True=verified, False=rejected
    profile_completed = Column(Boolean, default=False)  # Track if profile setup is complete
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional profile information
    classes_taking = Column(Text, nullable=True)  # JSON string of current classes
    classes_taken = Column(Text, nullable=True)   # JSON string of past classes
    learn_best_when = Column(Text, nullable=True)
    study_snack = Column(Text, nullable=True)
    favorite_study_spot = Column(Text, nullable=True)
    mbti = Column(String(10), nullable=True)
    yap_to_study_ratio = Column(String(50), nullable=True)

    # Match preference flags
    match_by_gender = Column(Boolean, default=False)
    match_by_major = Column(Boolean, default=False)
    match_by_academic_year = Column(Boolean, default=False)
