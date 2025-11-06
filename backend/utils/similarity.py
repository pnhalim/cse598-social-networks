"""
Utility functions for calculating similarity between users for study buddy matching.
"""
from typing import List, Optional, Tuple
from models.models import User


def calculate_similarity_score(current_user: User, candidate_user: User) -> float:
    """
    Calculate a similarity score between two users based on their profile attributes.
    Returns a score between 0.0 and 1.0, where 1.0 is most similar.
    
    Scoring factors:
    - Major match: 0.3 points
    - Academic year match: 0.2 points
    - Current classes overlap (classes_taking): 0.2 points (proportional to overlap, weighted more)
    - Past classes overlap (classes_taken): 0.1 points (proportional to overlap, weighted less)
    - MBTI match: 0.05 points
    - Yap to study ratio match: 0.05 points
    - Learn best when similarity: 0.05 points (text similarity)
    - Study snack similarity: 0.05 points (text similarity)
    - Favorite study spot similarity: 0.05 points (text similarity)
    """
    score = 0.0
    
    # Major match (0.3 points)
    if current_user.major and candidate_user.major:
        if current_user.major.lower() == candidate_user.major.lower():
            score += 0.3
    
    # Academic year match (0.2 points)
    if current_user.academic_year and candidate_user.academic_year:
        if current_user.academic_year.lower() == candidate_user.academic_year.lower():
            score += 0.2
    
    # Current classes overlap (0.2 points, weighted more heavily)
    # Both users are currently taking the same classes
    if current_user.classes_taking and candidate_user.classes_taking:
        current_taking = set(str(c).lower().strip() for c in current_user.classes_taking if c)
        candidate_taking = set(str(c).lower().strip() for c in candidate_user.classes_taking if c)
        
        if current_taking and candidate_taking:
            intersection = current_taking.intersection(candidate_taking)
            union = current_taking.union(candidate_taking)
            if union:
                jaccard_similarity = len(intersection) / len(union)
                score += 0.2 * jaccard_similarity
    
    # Past classes overlap (0.1 points, weighted less)
    # Both users have taken the same classes in the past
    if current_user.classes_taken and candidate_user.classes_taken:
        current_taken = set(str(c).lower().strip() for c in current_user.classes_taken if c)
        candidate_taken = set(str(c).lower().strip() for c in candidate_user.classes_taken if c)
        
        if current_taken and candidate_taken:
            intersection = current_taken.intersection(candidate_taken)
            union = current_taken.union(candidate_taken)
            if union:
                jaccard_similarity = len(intersection) / len(union)
                score += 0.1 * jaccard_similarity
    
    # MBTI match (0.05 points)
    if current_user.mbti and candidate_user.mbti:
        if current_user.mbti.upper() == candidate_user.mbti.upper():
            score += 0.05
    
    # Yap to study ratio match (0.05 points)
    if current_user.yap_to_study_ratio and candidate_user.yap_to_study_ratio:
        if current_user.yap_to_study_ratio.lower() == candidate_user.yap_to_study_ratio.lower():
            score += 0.05
    
    # Text similarity for learn_best_when (0.05 points)
    if current_user.learn_best_when and candidate_user.learn_best_when:
        text_sim = _text_similarity(
            current_user.learn_best_when.lower(),
            candidate_user.learn_best_when.lower()
        )
        score += 0.05 * text_sim
    
    # Text similarity for study_snack (0.05 points)
    if current_user.study_snack and candidate_user.study_snack:
        text_sim = _text_similarity(
            current_user.study_snack.lower(),
            candidate_user.study_snack.lower()
        )
        score += 0.05 * text_sim
    
    # Text similarity for favorite_study_spot (0.05 points)
    if current_user.favorite_study_spot and candidate_user.favorite_study_spot:
        text_sim = _text_similarity(
            current_user.favorite_study_spot.lower(),
            candidate_user.favorite_study_spot.lower()
        )
        score += 0.05 * text_sim
    
    return score


def _text_similarity(text1: str, text2: str) -> float:
    """
    Calculate a simple text similarity score between two strings.
    Uses word overlap (Jaccard similarity on words).
    Returns a score between 0.0 and 1.0.
    """
    if not text1 or not text2:
        return 0.0
    
    # Split into words and normalize
    words1 = set(word.strip() for word in text1.split() if word.strip())
    words2 = set(word.strip() for word in text2.split() if word.strip())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    if not union:
        return 0.0
    
    return len(intersection) / len(union)


def sort_users_by_similarity(current_user: User, candidate_users: List[User]) -> List[Tuple[User, float]]:
    """
    Sort a list of candidate users by their similarity to the current user.
    Returns a list of tuples (user, similarity_score) sorted by score descending.
    """
    scored_users = [
        (user, calculate_similarity_score(current_user, user))
        for user in candidate_users
    ]
    
    # Sort by similarity score descending, then by user id ascending for stability
    scored_users.sort(key=lambda x: (-x[1], x[0].id))
    
    return scored_users

