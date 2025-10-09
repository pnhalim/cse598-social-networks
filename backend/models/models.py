from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
from typing import Optional, List

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
    classes_taking = Column(JSON, nullable=True)  # List of current classes
    classes_taken = Column(JSON, nullable=True)   # List of past classes
    learn_best_when = Column(Text, nullable=True)
    study_snack = Column(Text, nullable=True)
    favorite_study_spot = Column(Text, nullable=True)
    mbti = Column(String(10), nullable=True)
    yap_to_study_ratio = Column(String(50), nullable=True)

    # Match preference flags
    match_by_gender = Column(Boolean, default=False)
    match_by_major = Column(Boolean, default=False)
    match_by_academic_year = Column(Boolean, default=False)
    
    # Relationships for mutual matching
    approvals_given = relationship("UserApproval", foreign_keys="UserApproval.approver_id", back_populates="approver")
    approvals_received = relationship("UserApproval", foreign_keys="UserApproval.approved_user_id", back_populates="approved_user")


class VerificationCode(Base):
    __tablename__ = "verification_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(20), nullable=False)  # "verify" or "reject"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User")


class UserApproval(Base):
    __tablename__ = "user_approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_approved = Column(Boolean, nullable=False)  # True for approval, False for rejection
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    approver = relationship("User", foreign_keys=[approver_id], back_populates="approvals_given")
    approved_user = relationship("User", foreign_keys=[approved_user_id], back_populates="approvals_received")
    
    # Ensure a user can only approve/reject another user once
    __table_args__ = (
        {"extend_existing": True}
    )


class UserSelection(Base):
    __tablename__ = "user_selections"

    id = Column(Integer, primary_key=True, index=True)
    selector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    selected_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Optional relationships
    # Not creating back_populates on User to avoid unintended loading; can be added later if needed

    __table_args__ = (
        {"sqlite_autoincrement": True},
    )
