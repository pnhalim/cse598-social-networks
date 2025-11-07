from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.schemas import (
    HealthResponse, 
    StatisticsResponse, 
    UserStatisticsResponse,
    MeetingOccurrenceResponse,
    ReputationReachOutStatsResponse
)
from services.statistics_service import (
    calculate_meeting_occurrence_percentage,
    calculate_reputation_reach_out_stats,
    get_user_statistics
)

# Create router for general routes
router = APIRouter(prefix="/api", tags=["general"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", message="Study Buddy API is running")

@router.get("/statistics", response_model=StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    """
    Get overall platform statistics:
    - Meeting occurrence: percentage of users reporting at least one session met
    - Reputation reach outs: statistics about reach outs to users with vs without badges
    """
    # Calculate meeting occurrence
    meeting_percentage = calculate_meeting_occurrence_percentage(db)
    
    # Get total users for meeting occurrence
    from models.models import User
    total_users = db.query(User).filter(User.profile_completed == True).count()
    
    # Get unique users with meetings
    from models.models import ReachOut
    from sqlalchemy import func
    sender_ids = db.query(ReachOut.sender_id).filter(ReachOut.met == True).distinct().all()
    recipient_ids = db.query(ReachOut.recipient_id).filter(ReachOut.met == True).distinct().all()
    unique_user_ids = set([id[0] for id in sender_ids] + [id[0] for id in recipient_ids])
    users_with_meetings = len(unique_user_ids)
    
    # Calculate reputation reach out stats
    reputation_stats = calculate_reputation_reach_out_stats(db)
    
    return StatisticsResponse(
        meeting_occurrence=MeetingOccurrenceResponse(
            percentage=meeting_percentage,
            users_with_meetings=users_with_meetings,
            total_users=total_users
        ),
        reputation_reach_outs=ReputationReachOutStatsResponse(
            total_reach_outs=reputation_stats['total_reach_outs'],
            to_badged_users=reputation_stats['to_badged_users'],
            to_non_badged_users=reputation_stats['to_non_badged_users'],
            badged_percentage=reputation_stats['badged_percentage'],
            non_badged_percentage=reputation_stats['non_badged_percentage']
        )
    )

@router.get("/statistics/user/{user_id}", response_model=UserStatisticsResponse)
def get_user_statistics_endpoint(user_id: int, db: Session = Depends(get_db)):
    """
    Get statistics for a specific user:
    - Total reach-out count (number of reach out emails sent)
    - Total meetings (as sender and recipient)
    """
    stats = get_user_statistics(db, user_id)
    return UserStatisticsResponse(**stats)
