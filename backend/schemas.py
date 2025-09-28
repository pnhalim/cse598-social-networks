from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    gender: str
    major: str
    school_email: str
    academic_year: str
    profile_picture: Optional[str] = None
    classes_taking: Optional[str] = None
    classes_taken: Optional[str] = None
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
    classes_taking: Optional[str] = None
    classes_taken: Optional[str] = None
    learn_best_when: Optional[str] = None
    study_snack: Optional[str] = None
    favorite_study_spot: Optional[str] = None
    mbti: Optional[str] = None
    yap_to_study_ratio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    frontend_design: str
    email_verified: Optional[bool] = None  # None=pending, True=verified, False=rejected
    created_at: datetime
    updated_at: Optional[datetime] = None

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
