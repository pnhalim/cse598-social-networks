"""
Reputation service for calculating and managing user reputation scores
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from models.models import User, StudySessionRating

# All possible rating criteria
ALL_CRITERIA = [
    "timeliness",
    "focus",
    "collaboration",
    "attitude",
    "listening",
    "reliability",
    "communication",
    "preparation"
]

def get_random_criteria():
    """Get 3 randomly selected criteria from the list"""
    import random
    return random.sample(ALL_CRITERIA, 3)

def calculate_reputation_change(rating_1: int, rating_2: int, rating_3: int) -> int:
    """
    Calculate reputation change based on ratings:
    - Ratings < 3: decrease reputation
    - Rating = 3: no change
    - Ratings > 3: increase reputation
    """
    change = 0
    for rating in [rating_1, rating_2, rating_3]:
        if rating < 3:
            change -= 1  # Decrease reputation
        elif rating > 3:
            change += 1  # Increase reputation
        # rating == 3: no change
    
    return change

def update_user_reputation(db: Session, user_id: int, rating_1: int, rating_2: int, rating_3: int):
    """Update user's reputation score based on new ratings"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    # Calculate reputation change
    change = calculate_reputation_change(rating_1, rating_2, rating_3)
    
    # Apply decay (natural decay over time - simple implementation: small decay per rating)
    # For now, we'll just apply the change. Decay can be implemented as a scheduled task later.
    user.reputation_score = (user.reputation_score or 0) + change
    
    # Check for badge eligibility
    check_and_update_badge(db, user_id)
    
    db.commit()
    db.refresh(user)

def check_and_update_badge(db: Session, user_id: int):
    """
    Check if user qualifies for "Trusted Study Buddy This Week" badge.
    Criteria: at least two 5-star ratings and one 4-star rating in any categories
    (from the past week's ratings)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    # Get ratings from the past week
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_ratings = db.query(StudySessionRating).filter(
        and_(
            StudySessionRating.rated_user_id == user_id,
            StudySessionRating.created_at >= week_ago
        )
    ).all()
    
    # Count 5-star and 4-star ratings across all criteria
    five_star_count = 0
    four_star_count = 0
    
    for rating in recent_ratings:
        ratings = [rating.rating_1, rating.rating_2, rating.rating_3]
        for r in ratings:
            if r == 5:
                five_star_count += 1
            elif r == 4:
                four_star_count += 1
    
    # Check badge criteria: at least 2 five-star ratings and 1 four-star rating
    # Update badge status
    should_have_badge = five_star_count >= 2 and four_star_count >= 1
    
    if user.trusted_badge_this_week != should_have_badge:
        user.trusted_badge_this_week = should_have_badge
        db.commit()

def apply_reputation_decay(db: Session):
    """
    Apply natural decay to reputation scores over time.
    This should be called periodically (e.g., daily via a scheduled task).
    For now, we'll implement a simple decay mechanism.
    """
    # Simple decay: reduce all positive scores by 1 point per week
    # This can be made more sophisticated later
    users = db.query(User).filter(User.reputation_score > 0).all()
    for user in users:
        # Decay by 1 point (but don't go below 0)
        user.reputation_score = max(0, (user.reputation_score or 0) - 1)
    
    db.commit()

