from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from core.database import get_db
from models.models import User, UserSelection, StudySessionRating
from models.schemas import (
    CursorPageParams,
    CursorPageResponse,
    ListUserSummary,
    SelectBuddyRequest,
    SelectBuddyResponse,
)
from config.auth_dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["list view"]) 


def _apply_user_preferences_query(db: Session, current_user: User):
    query = db.query(User).filter(
        and_(
            User.id != current_user.id,
            User.profile_completed == True,
            User.frontend_design == "design1",
        )
    )

    if current_user.match_by_gender and current_user.gender:
        query = query.filter(User.gender == current_user.gender)
    if current_user.match_by_major and current_user.major:
        query = query.filter(User.major == current_user.major)
    if current_user.match_by_academic_year and current_user.academic_year:
        query = query.filter(User.academic_year == current_user.academic_year)

    # Also respect the candidate users' preferences: if they toggled a filter, they require a match
    # Candidate requires same gender
    if current_user.gender:
        query = query.filter(or_(User.match_by_gender == False, User.gender == current_user.gender))
    else:
        query = query.filter(User.match_by_gender == False)

    # Candidate requires same major
    if current_user.major:
        query = query.filter(or_(User.match_by_major == False, User.major == current_user.major))
    else:
        query = query.filter(User.match_by_major == False)

    # Candidate requires same academic year
    if current_user.academic_year:
        query = query.filter(or_(User.match_by_academic_year == False, User.academic_year == current_user.academic_year))
    else:
        query = query.filter(User.match_by_academic_year == False)

    return query


@router.get("/list/users", response_model=CursorPageResponse)
def list_users(
    params: CursorPageParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List users that match the current user's preferences using cursor pagination.
    Only available for users with frontend_design == 'design1'.
    """
    if current_user.frontend_design != "design1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for users on the list view design",
        )

    base_q = _apply_user_preferences_query(db, current_user).order_by(User.id.asc())

    if params.cursor is not None:
        base_q = base_q.filter(User.id > params.cursor)

    limit = max(1, min(params.limit, 50))
    items = base_q.limit(limit + 1).all()

    # Calculate average ratings for all users
    user_ids = [u.id for u in items[:limit]]
    rating_stats = db.query(
        StudySessionRating.rated_user_id,
        func.avg((StudySessionRating.rating_1 + StudySessionRating.rating_2 + StudySessionRating.rating_3) / 3.0).label('avg_rating')
    ).filter(
        StudySessionRating.rated_user_id.in_(user_ids)
    ).group_by(StudySessionRating.rated_user_id).all()
    
    rating_dict = {user_id: float(avg) for user_id, avg in rating_stats}

    summaries = [
        ListUserSummary(
            id=u.id,
            name=u.name,
            school_email=u.school_email,
            gender=u.gender,
            major=u.major,
            academic_year=u.academic_year,
            profile_picture=u.profile_picture,
            classes_taking=u.classes_taking,
            learn_best_when=u.learn_best_when,
            study_snack=u.study_snack,
            favorite_study_spot=u.favorite_study_spot,
            mbti=u.mbti,
            yap_to_study_ratio=u.yap_to_study_ratio,
            average_rating=rating_dict.get(u.id),
            reputation_score=u.reputation_score,
        )
        for u in items[:limit]
    ]

    has_more = len(items) > limit
    # Use the last item actually returned to the client to compute the next cursor
    next_cursor = summaries[-1].id if summaries else None

    return CursorPageResponse(items=summaries, next_cursor=next_cursor, has_more=has_more)


@router.post("/list/select", response_model=SelectBuddyResponse, status_code=status.HTTP_201_CREATED)
def select_study_buddy(
    selection: SelectBuddyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allow a design1 user to select another user as their desired study buddy.
    Persist the selection (idempotent).
    """
    if current_user.frontend_design != "design1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for users on the list view design",
        )

    # Validate target user exists and matches base criteria (completed profile and not self)
    target = db.query(User).filter(User.id == selection.selected_user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot select yourself")
    if not target.profile_completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target user's profile is not complete")

    # Idempotent create: check if selection already exists
    existing = db.query(UserSelection).filter(
        and_(
            UserSelection.selector_id == current_user.id,
            UserSelection.selected_user_id == target.id,
        )
    ).first()

    if not existing:
        record = UserSelection(selector_id=current_user.id, selected_user_id=target.id)
        db.add(record)
        db.commit()
    
    return SelectBuddyResponse(
        message="Selection recorded",
        selected_user_id=target.id,
        selected_user_email=target.school_email,
    )
