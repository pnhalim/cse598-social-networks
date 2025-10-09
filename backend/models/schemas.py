from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime

# Step 1: Email submission
class EmailRequest(BaseModel):
    school_email: str
    
    @validator('school_email')
    def validate_email(cls, v):
        if not v.endswith('@umich.edu'):
            raise ValueError('Email must be a valid @umich.edu email address')
        return v

# Step 2: Password setup after email verification
class PasswordSetup(BaseModel):
    password: str
    confirm_password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Check byte length more carefully
        try:
            byte_length = len(v.encode('utf-8'))
            if byte_length > 72:
                raise ValueError(f'Password cannot be longer than 72 bytes (current: {byte_length} bytes)')
        except UnicodeEncodeError:
            raise ValueError('Password contains invalid characters')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

# Step 3: Profile completion
class ProfileSetup(BaseModel):
    name: str
    gender: str
    major: str
    academic_year: str
    profile_picture: Optional[str] = None
    classes_taking: Optional[List[str]] = None
    classes_taken: Optional[List[str]] = None
    learn_best_when: Optional[str] = None
    study_snack: Optional[str] = None
    favorite_study_spot: Optional[str] = None
    mbti: Optional[str] = None
    yap_to_study_ratio: Optional[str] = None

# Legacy schemas for backward compatibility
class UserBase(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    major: Optional[str] = None
    school_email: str
    academic_year: Optional[str] = None
    profile_picture: Optional[str] = None
    classes_taking: Optional[List[str]] = None
    classes_taken: Optional[List[str]] = None
    learn_best_when: Optional[str] = None
    study_snack: Optional[str] = None
    favorite_study_spot: Optional[str] = None
    mbti: Optional[str] = None
    yap_to_study_ratio: Optional[str] = None

    @validator('school_email')
    def validate_email(cls, v):
        if not v.endswith('@umich.edu'):
            raise ValueError('Email must be a valid @umich.edu email address')
        return v

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    major: Optional[str] = None
    profile_picture: Optional[str] = None
    academic_year: Optional[str] = None
    classes_taking: Optional[List[str]] = None
    classes_taken: Optional[List[str]] = None
    learn_best_when: Optional[str] = None
    study_snack: Optional[str] = None
    favorite_study_spot: Optional[str] = None
    mbti: Optional[str] = None
    yap_to_study_ratio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    frontend_design: Optional[str] = None  # Made optional since it's assigned after profile completion
    email_verified: Optional[bool] = None  # None=pending, True=verified, False=rejected
    profile_completed: Optional[bool] = None  # Track if profile setup is complete
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Preference flags
    match_by_gender: Optional[bool] = None
    match_by_major: Optional[bool] = None
    match_by_academic_year: Optional[bool] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int

class MessageResponse(BaseModel):
    message: str

class HealthResponse(BaseModel):
    status: str
    message: str

class EmailVerificationResponse(BaseModel):
    message: str
    user: UserResponse

class EmailSentResponse(BaseModel):
    message: str
    email_sent: bool

class EmailRequestResponse(BaseModel):
    message: str
    email_sent: bool

class PasswordSetupResponse(BaseModel):
    message: str
    user_id: int
    access_token: str
    token_type: str = "bearer"

class ProfileSetupResponse(BaseModel):
    message: str
    user: UserResponse

# Authentication schemas
class LoginRequest(BaseModel):
    school_email: str
    password: str
    
    @validator('school_email')
    def validate_email(cls, v):
        if not v.endswith('@umich.edu'):
            raise ValueError('Email must be a valid @umich.edu email address')
        return v

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# New filter schemas
class FilterOptionsResponse(BaseModel):
    genders: list[str]
    majors: list[str]
    academic_years: list[str]

class UserFilterParams(BaseModel):
    gender: Optional[str] = None
    major: Optional[str] = None
    academic_year: Optional[str] = None

class PreferencesUpdate(BaseModel):
    match_by_gender: Optional[bool] = None
    match_by_major: Optional[bool] = None
    match_by_academic_year: Optional[bool] = None

# Mutual matching schemas
class ApprovalRequest(BaseModel):
    approved_user_id: int
    is_approved: bool  # True for approval, False for rejection

class ApprovalResponse(BaseModel):
    message: str
    approval_id: int

class MutualMatchResponse(BaseModel):
    id: int
    name: str
    school_email: str
    gender: Optional[str] = None
    major: Optional[str] = None
    academic_year: Optional[str] = None
    profile_picture: Optional[str] = None
    classes_taking: Optional[List[str]] = None
    learn_best_when: Optional[str] = None
    study_snack: Optional[str] = None
    favorite_study_spot: Optional[str] = None
    mbti: Optional[str] = None
    yap_to_study_ratio: Optional[str] = None
    matched_at: datetime

class MutualMatchesResponse(BaseModel):
    matches: List[MutualMatchResponse]
    total: int

class CursorPageParams(BaseModel):
    cursor: Optional[int] = None  # exclusive user.id to start after
    limit: int = 20

class ListUserSummary(BaseModel):
    id: int
    name: Optional[str] = None
    school_email: Optional[str] = None
    gender: Optional[str] = None
    major: Optional[str] = None
    academic_year: Optional[str] = None
    profile_picture: Optional[str] = None
    classes_taking: Optional[List[str]] = None
    learn_best_when: Optional[str] = None
    study_snack: Optional[str] = None
    favorite_study_spot: Optional[str] = None
    mbti: Optional[str] = None
    yap_to_study_ratio: Optional[str] = None

    class Config:
        from_attributes = True

class CursorPageResponse(BaseModel):
    items: List[ListUserSummary]
    next_cursor: Optional[int] = None
    has_more: bool

class SelectBuddyRequest(BaseModel):
    selected_user_id: int

class SelectBuddyResponse(BaseModel):
    message: str
    selected_user_id: int
    selected_user_email: str
