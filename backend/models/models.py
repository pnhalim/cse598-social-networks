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
    frontend_design = Column(String(20), nullable=True)  # 'design1' - assigned after profile completion
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
    
    # Reputation system
    reputation_score = Column(Integer, default=0)  # Starts at 0, can go negative
    trusted_badge_this_week = Column(Boolean, default=False)  # "Trusted Study Buddy This Week" badge
    
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


class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=True)  # Optional reason for the report
    context = Column(String(50), nullable=True)  # e.g., "profile_view", "reach_out", etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    
    __table_args__ = (
        {"extend_existing": True},
    )


class ReachOut(Base):
    __tablename__ = "reach_outs"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    personal_message = Column(Text, nullable=True)
    met = Column(Boolean, nullable=True)  # None = not specified, True = met, False = didn't meet
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    
    __table_args__ = (
        {"extend_existing": True},
    )


class StudySessionRating(Base):
    __tablename__ = "study_session_ratings"

    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # User giving the rating
    rated_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # User being rated
    reach_out_id = Column(Integer, ForeignKey("reach_outs.id"), nullable=False)  # Which connection this rating is for
    
    # Randomly selected 3 criteria ratings (1-5 stars)
    criterion_1 = Column(String(50), nullable=False)  # e.g., "timeliness"
    rating_1 = Column(Integer, nullable=False)  # 1-5
    criterion_2 = Column(String(50), nullable=False)
    rating_2 = Column(Integer, nullable=False)
    criterion_3 = Column(String(50), nullable=False)
    rating_3 = Column(Integer, nullable=False)
    
    # Optional reflection note
    reflection_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    rater = relationship("User", foreign_keys=[rater_id])
    rated_user = relationship("User", foreign_keys=[rated_user_id])
    reach_out = relationship("ReachOut")
    
    __table_args__ = (
        {"extend_existing": True},
    )


class UserNote(Base):
    __tablename__ = "user_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    note_text = Column(Text, nullable=False)  # "What made this session work well?" response
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationship
    user = relationship("User")
    
    __table_args__ = (
        {"extend_existing": True},
    )
