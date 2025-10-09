import random
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.models import User

def assign_frontend_design():
    """
    Assign user to design1 (list view) or design2 (mutual matching).
    Uses balanced assignment to ensure roughly equal distribution.
    """
    db = SessionLocal()
    try:
        # Count existing users by design
        design1_count = db.query(User).filter(User.frontend_design == 'design1').count()
        design2_count = db.query(User).filter(User.frontend_design == 'design2').count()
        
        # If counts are equal, randomly choose
        if design1_count == design2_count:
            return random.choice(['design1', 'design2'])
        
        # Assign to the design with fewer users
        if design1_count < design2_count:
            return 'design1'
        else:
            return 'design2'
            
    except Exception as e:
        # Fallback to random assignment if database query fails
        print(f"Warning: Could not query design counts, using random assignment: {e}")
        return random.choice(['design1', 'design2'])
    finally:
        db.close()
