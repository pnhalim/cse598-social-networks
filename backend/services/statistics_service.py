"""
Statistics service for tracking user engagement metrics
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from models.models import User, ReachOut


def get_user_reach_out_count(db: Session, user_id: int) -> int:
    """
    Get total number of reach out emails sent by a user (all time)
    """
    return db.query(ReachOut).filter(ReachOut.sender_id == user_id).count()


def get_all_users_reach_out_counts(db: Session) -> dict:
    """
    Get reach-out counts for all users
    Returns: {user_id: count}
    """
    results = db.query(
        ReachOut.sender_id,
        func.count(ReachOut.id).label('count')
    ).group_by(ReachOut.sender_id).all()
    
    return {user_id: count for user_id, count in results}


def calculate_meeting_occurrence_percentage(db: Session) -> float:
    """
    Calculate the percentage of users who have reported at least one session as met
    """
    # Get total number of users who have completed profiles
    total_users = db.query(User).filter(User.profile_completed == True).count()
    
    if total_users == 0:
        return 0.0
    
    # Get unique user IDs who have at least one met=True reach_out (as sender or recipient)
    sender_ids = db.query(ReachOut.sender_id).filter(ReachOut.met == True).distinct().all()
    recipient_ids = db.query(ReachOut.recipient_id).filter(ReachOut.met == True).distinct().all()
    unique_user_ids = set([id[0] for id in sender_ids] + [id[0] for id in recipient_ids])
    users_with_meetings = len(unique_user_ids)
    
    return (users_with_meetings / total_users) * 100.0


def calculate_reputation_reach_out_stats(db: Session) -> dict:
    """
    Calculate statistics about reach outs to users with vs without reputation badges
    Returns: {
        'total_reach_outs': int,
        'to_badged_users': int,
        'to_non_badged_users': int,
        'badged_percentage': float,
        'non_badged_percentage': float
    }
    """
    # Get all reach outs
    total_reach_outs = db.query(ReachOut).count()
    
    if total_reach_outs == 0:
        return {
            'total_reach_outs': 0,
            'to_badged_users': 0,
            'to_non_badged_users': 0,
            'badged_percentage': 0.0,
            'non_badged_percentage': 0.0
        }
    
    # Get reach outs to users with trusted badge
    reach_outs_to_badged = db.query(ReachOut).join(
        User, ReachOut.recipient_id == User.id
    ).filter(User.trusted_badge_this_week == True).count()
    
    reach_outs_to_non_badged = total_reach_outs - reach_outs_to_badged
    
    return {
        'total_reach_outs': total_reach_outs,
        'to_badged_users': reach_outs_to_badged,
        'to_non_badged_users': reach_outs_to_non_badged,
        'badged_percentage': (reach_outs_to_badged / total_reach_outs) * 100.0 if total_reach_outs > 0 else 0.0,
        'non_badged_percentage': (reach_outs_to_non_badged / total_reach_outs) * 100.0 if total_reach_outs > 0 else 0.0
    }


def get_user_statistics(db: Session, user_id: int) -> dict:
    """
    Get statistics for a specific user
    """
    reach_out_count = get_user_reach_out_count(db, user_id)
    
    # Get number of meetings this user has had (as sender or recipient)
    meetings_as_sender = db.query(ReachOut).filter(
        and_(
            ReachOut.sender_id == user_id,
            ReachOut.met == True
        )
    ).count()
    
    meetings_as_recipient = db.query(ReachOut).filter(
        and_(
            ReachOut.recipient_id == user_id,
            ReachOut.met == True
        )
    ).count()
    
    total_meetings = meetings_as_sender + meetings_as_recipient
    
    return {
        'user_id': user_id,
        'total_reach_outs': reach_out_count,
        'total_meetings': total_meetings,
        'meetings_as_sender': meetings_as_sender,
        'meetings_as_recipient': meetings_as_recipient
    }

