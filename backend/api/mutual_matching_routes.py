from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import datetime, timedelta
from core.database import get_db
from models.models import User, UserApproval
from models.schemas import (
    ApprovalRequest, ApprovalResponse, MutualMatchResponse, MutualMatchesResponse, MessageResponse
)
from config.auth_dependencies import get_current_user

# Create router for mutual matching routes
router = APIRouter(prefix="/api", tags=["mutual matching"])

@router.post("/approve-user", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
def approve_or_reject_user(
    approval_request: ApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a potential study buddy.
    Only available for users with design2 (mutual matching).
    """
    # Check if user is on design2
    if current_user.frontend_design != "design2":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for users on the mutual matching design"
        )
    
    # Check if the user to approve/reject exists
    target_user = db.query(User).filter(User.id == approval_request.approved_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is trying to approve/reject themselves
    if current_user.id == approval_request.approved_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot approve or reject yourself"
        )
    
    # Check if user has already acted on this person
    existing_approval = db.query(UserApproval).filter(
        and_(
            UserApproval.approver_id == current_user.id,
            UserApproval.approved_user_id == approval_request.approved_user_id
        )
    ).first()
    
    if existing_approval:
        # Update existing approval/rejection
        existing_approval.is_approved = approval_request.is_approved
        approval_id = existing_approval.id
        action = "updated"
    else:
        # Create new approval/rejection
        new_approval = UserApproval(
            approver_id=current_user.id,
            approved_user_id=approval_request.approved_user_id,
            is_approved=approval_request.is_approved
        )
        db.add(new_approval)
        db.commit()
        db.refresh(new_approval)
        approval_id = new_approval.id
        action = "created"
    
    action_text = "approved" if approval_request.is_approved else "rejected"
    message = f"Successfully {action_text} user. Action {action}."
    
    return ApprovalResponse(message=message, approval_id=approval_id)

@router.get("/mutual-matches", response_model=MutualMatchesResponse)
def get_mutual_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all users who have mutually matched with the current user.
    Only available for users with design2 (mutual matching).
    """
    # Check if user is on design2
    if current_user.frontend_design != "design2":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for users on the mutual matching design"
        )
    
    # Find mutual matches
    # A mutual match is when:
    # 1. Current user has approved another user (is_approved=True)
    # 2. That other user has also approved the current user (is_approved=True)
    
    # Get all users that the current user has approved
    users_approved_by_current = db.query(UserApproval.approved_user_id).filter(
        and_(
            UserApproval.approver_id == current_user.id,
            UserApproval.is_approved == True
        )
    ).subquery()
    
    # Get all users who have approved the current user
    users_who_approved_current = db.query(UserApproval.approver_id).filter(
        and_(
            UserApproval.approved_user_id == current_user.id,
            UserApproval.is_approved == True
        )
    ).subquery()
    
    # Find intersection - users who are both approved by current user AND have approved current user
    mutual_matches = db.query(User).filter(
        and_(
            User.id.in_(users_approved_by_current),
            User.id.in_(users_who_approved_current),
            User.id != current_user.id
        )
    ).all()
    
    # Convert to response format
    matches_response = []
    for user in mutual_matches:
        # Get the most recent approval timestamp for the match
        latest_approval = db.query(UserApproval).filter(
            and_(
                or_(
                    and_(UserApproval.approver_id == current_user.id, UserApproval.approved_user_id == user.id),
                    and_(UserApproval.approver_id == user.id, UserApproval.approved_user_id == current_user.id)
                ),
                UserApproval.is_approved == True
            )
        ).order_by(UserApproval.created_at.desc()).first()
        
        match_response = MutualMatchResponse(
            id=user.id,
            name=user.name or "Unknown",
            school_email=user.school_email,
            gender=user.gender,
            major=user.major,
            academic_year=user.academic_year,
            profile_picture=user.profile_picture,
            classes_taking=user.classes_taking,
            learn_best_when=user.learn_best_when,
            study_snack=user.study_snack,
            favorite_study_spot=user.favorite_study_spot,
            mbti=user.mbti,
            yap_to_study_ratio=user.yap_to_study_ratio,
            matched_at=latest_approval.created_at if latest_approval else user.created_at
        )
        matches_response.append(match_response)
    
    return MutualMatchesResponse(matches=matches_response, total=len(matches_response))

@router.get("/potential-matches", response_model=List[MutualMatchResponse])
def get_potential_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get potential study buddies for the current user.
    Returns users that the current user hasn't approved or rejected yet.
    Only available for users with design2 (mutual matching).
    """
    # Check if user is on design2
    if current_user.frontend_design != "design2":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for users on the mutual matching design"
        )
    
    # Get users that the current user hasn't approved or rejected yet
    # and who have completed their profiles
    users_already_acted_on = db.query(UserApproval.approved_user_id).filter(
        UserApproval.approver_id == current_user.id
    ).subquery()
    
    potential_matches = db.query(User).filter(
        and_(
            User.id != current_user.id,
            User.profile_completed == True,
            User.id.notin_(users_already_acted_on)
        )
    ).all()
    
    # Convert to response format
    matches_response = []
    for user in potential_matches:
        match_response = MutualMatchResponse(
            id=user.id,
            name=user.name or "Unknown",
            school_email=user.school_email,
            gender=user.gender,
            major=user.major,
            academic_year=user.academic_year,
            profile_picture=user.profile_picture,
            classes_taking=user.classes_taking,
            learn_best_when=user.learn_best_when,
            study_snack=user.study_snack,
            favorite_study_spot=user.favorite_study_spot,
            mbti=user.mbti,
            yap_to_study_ratio=user.yap_to_study_ratio,
            matched_at=user.created_at  # Use user creation date as fallback
        )
        matches_response.append(match_response)
    
    return matches_response

@router.post("/cleanup-old-approvals", response_model=MessageResponse)
def cleanup_old_approvals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove approvals/rejections that are more than 7 days old and don't result in mutual matching.
    Only available for users with design2 (mutual matching).
    """
    # Check if user is on design2
    if current_user.frontend_design != "design2":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for users on the mutual matching design"
        )
    
    # Calculate cutoff date (7 days ago)
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    
    try:
        # Find all approvals older than 7 days
        old_approvals = db.query(UserApproval).filter(
            UserApproval.created_at < cutoff_date
        ).all()
        
        deleted_count = 0
        
        for approval in old_approvals:
            # Check if this approval results in a mutual match
            # A mutual match exists if:
            # 1. User A approved User B (this approval)
            # 2. User B also approved User A
            
            approver_id = approval.approver_id
            approved_user_id = approval.approved_user_id
            
            # Check if there's a reverse approval
            reverse_approval = db.query(UserApproval).filter(
                and_(
                    UserApproval.approver_id == approved_user_id,
                    UserApproval.approved_user_id == approver_id,
                    UserApproval.is_approved == True
                )
            ).first()
            
            # If there's no reverse approval, this approval doesn't result in a mutual match
            # and can be safely deleted
            if not reverse_approval:
                db.delete(approval)
                deleted_count += 1
        
        db.commit()
        
        return MessageResponse(
            message=f"Successfully cleaned up {deleted_count} old approvals that didn't result in mutual matches."
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during cleanup: {str(e)}"
        )
