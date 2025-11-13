# backend/models/models.py
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
    match_by_study_preferences = Column(Boolean, default=False)  # For similar study preferences (learn_best_when, study_snack, favorite_study_spot, mbti, yap_to_study_ratio)
    match_by_classes = Column(Boolean, default=False)  # For similar classes (classes_taking, classes_taken)
    
    # Onboarding tracking
    survey_completed = Column(Boolean, default=False)  # Track if user has completed the pre-survey
    onboarding_completed = Column(Boolean, default=False)  # Track if user has completed onboarding with preferences
    
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


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Likert scale questions (1-5)
    q1_study_alone = Column(Integer, nullable=False)  # "I usually study alone for my classes."
    q2_enjoy_studying_with_others = Column(Integer, nullable=False)  # "I enjoy studying or doing coursework with at least one other person."
    q3_easily_find_study_buddy = Column(Integer, nullable=False)  # "When I want a study buddy, I can easily find someone."
    q4_wish_more_people = Column(Integer, nullable=False)  # "I wish I had more people to study with in my classes."
    q5_coordinating_barrier = Column(Integer, nullable=False)  # "Coordinating time and location is a barrier to studying with others."
    q6_worry_awkward = Column(Integer, nullable=False)  # "I worry that studying with someone new will feel awkward."
    q7_comfortable_approaching = Column(Integer, nullable=False)  # "I feel comfortable approaching a classmate I don't know well to ask if they want to study."
    q8_comfortable_online_platforms = Column(Integer, nullable=False)  # "I feel comfortable using online class platforms (e.g., Piazza, Discord, Ed) to find people to study or work with."
    q9_avoid_asking_afraid_no = Column(Integer, nullable=False)  # "I avoid asking classmates to study because I'm afraid they will say no."
    q10_feel_at_ease = Column(Integer, nullable=False)  # "Once I start a study session with someone, I usually feel at ease."
    q11_pressure_keep_studying = Column(Integer, nullable=False)  # "I feel pressure to keep studying with someone once I've started, even if it doesn't feel like a good fit."
    q12_feel_belong = Column(Integer, nullable=False)  # "I feel like I belong in my major or academic program."
    q13_core_group_peers = Column(Integer, nullable=False)  # "I have a core group of peers I can rely on for academic support."
    q14_students_open_collaborating = Column(Integer, nullable=False)  # "Students in my classes are generally open to collaborating."
    
    # Short answer questions
    q15_hardest_part = Column(Text, nullable=False)  # "What is the hardest part about finding someone to study with right now?"
    q16_bad_experience = Column(Text, nullable=False)  # "If you've had a bad experience with study buddies or study groups in the past, what happened, and how did it affect you?"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User")
    
    __table_args__ = (
        {"extend_existing": True},
    )
