#!/usr/bin/env python3
"""
Script to create test users for testing the mutual matching functionality.
This will create users with both design1 and design2 assignments.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from models.models import User, Base
from services.auth_utils import hash_password
import random
import string

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def generate_random_email():
    """Generate a random email address for testing"""
    # Common first names and last names for variety
    first_names = [
        "alex", "sam", "jordan", "taylor", "casey", "riley", "morgan", "jamie",
        "chris", "drew", "blake", "sage", "quinn", "finley", "avery", "cameron",
        "dana", "emery", "hayden", "kendall", "parker", "reese", "skyler", "tyler"
    ]
    
    last_names = [
        "smith", "johnson", "williams", "brown", "jones", "garcia", "miller",
        "davis", "rodriguez", "martinez", "hernandez", "lopez", "gonzalez",
        "wilson", "anderson", "thomas", "taylor", "moore", "jackson", "martin",
        "lee", "perez", "thompson", "white", "harris", "sanchez", "clark",
        "ramirez", "lewis", "robinson", "walker", "young", "allen", "king"
    ]
    
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    
    # Add random numbers to make emails more unique
    random_suffix = random.randint(100, 9999)
    
    return f"{first_name}.{last_name}{random_suffix}@umich.edu"

def create_test_users():
    """Create test users for testing mutual matching"""
    
    # Sample data for test users (without email addresses - will be generated)
    test_users_data = [
        {
            "name": "Alice Johnson",
            "gender": "Female",
            "major": "Computer Science",
            "academic_year": "Junior",
            "classes_taking": ["EECS 281", "EECS 370", "MATH 214"],
            "learn_best_when": "In the morning with coffee",
            "study_snack": "Trail mix",
            "favorite_study_spot": "Hatcher Library",
            "mbti": "INTJ",
            "yap_to_study_ratio": "20% yap, 80% study"
        },
        {
            "name": "Bob Smith",
            "gender": "Male",
            "major": "Engineering",
            "academic_year": "Graduate",
            "classes_taking": ["EECS 376", "EECS 445", "STATS 250"],
            "learn_best_when": "Late at night",
            "study_snack": "Energy drinks",
            "favorite_study_spot": "Duderstadt Center",
            "mbti": "ENTP",
            "yap_to_study_ratio": "40% yap, 60% study"
        },
        {
            "name": "Carol Davis",
            "gender": "Female",
            "major": "Data Science",
            "academic_year": "Sophomore",
            "classes_taking": ["EECS 183", "MATH 116", "STATS 250"],
            "learn_best_when": "Afternoon with music",
            "study_snack": "Fruit",
            "favorite_study_spot": "Shapiro Library",
            "mbti": "ISFJ",
            "yap_to_study_ratio": "10% yap, 90% study"
        },
        {
            "name": "David Wilson",
            "gender": "Male",
            "major": "Business",
            "academic_year": "Junior",
            "classes_taking": ["BUS 300", "ECON 101", "MATH 115"],
            "learn_best_when": "Early morning",
            "study_snack": "Granola bars",
            "favorite_study_spot": "Ross School of Business",
            "mbti": "ESTJ",
            "yap_to_study_ratio": "30% yap, 70% study"
        },
        {
            "name": "Emma Brown",
            "gender": "Female",
            "major": "Psychology",
            "academic_year": "Senior",
            "classes_taking": ["PSYCH 240", "PSYCH 280", "STATS 250"],
            "learn_best_when": "Evening with tea",
            "study_snack": "Dark chocolate",
            "favorite_study_spot": "Angell Hall",
            "mbti": "ENFP",
            "yap_to_study_ratio": "50% yap, 50% study"
        },
        {
            "name": "Frank Miller",
            "gender": "Male",
            "major": "Engineering",
            "academic_year": "Graduate",
            "classes_taking": ["PHYS 340", "PHYS 360", "MATH 217"],
            "learn_best_when": "Late night",
            "study_snack": "Coffee and cookies",
            "favorite_study_spot": "Randall Lab",
            "mbti": "INTP",
            "yap_to_study_ratio": "15% yap, 85% study"
        },
        {
            "name": "Grace Lee",
            "gender": "Female",
            "major": "Biology",
            "academic_year": "Sophomore",
            "classes_taking": ["BIOL 171", "CHEM 210", "MATH 115"],
            "learn_best_when": "Morning with sunlight",
            "study_snack": "Nuts",
            "favorite_study_spot": "Natural History Museum",
            "mbti": "ISFP",
            "yap_to_study_ratio": "25% yap, 75% study"
        },
        {
            "name": "Henry Taylor",
            "gender": "Male",
            "major": "Economics",
            "academic_year": "Junior",
            "classes_taking": ["ECON 401", "ECON 402", "STATS 250"],
            "learn_best_when": "Afternoon",
            "study_snack": "Sandwiches",
            "favorite_study_spot": "Lorch Hall",
            "mbti": "ENTJ",
            "yap_to_study_ratio": "35% yap, 65% study"
        },
        {
            "name": "Ivy Chen",
            "gender": "Female",
            "major": "Art History",
            "academic_year": "Senior",
            "classes_taking": ["HISTART 101", "HISTART 200", "ENGLISH 125"],
            "learn_best_when": "Quiet afternoon",
            "study_snack": "Tea and biscuits",
            "favorite_study_spot": "Museum of Art",
            "mbti": "INFJ",
            "yap_to_study_ratio": "45% yap, 55% study"
        },
        {
            "name": "Jack Anderson",
            "gender": "Male",
            "major": "Engineering",
            "academic_year": "Senior",
            "classes_taking": ["MECHENG 250", "MECHENG 350", "MATH 216"],
            "learn_best_when": "Early morning",
            "study_snack": "Protein bars",
            "favorite_study_spot": "G.G. Brown Building",
            "mbti": "ISTP",
            "yap_to_study_ratio": "20% yap, 80% study"
        }
    ]
    
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_emails = {user.school_email for user in db.query(User).all()}
        
        created_count = 0
        design1_count = 0
        design2_count = 0
        
        for user_data in test_users_data:
            # Generate a unique random email
            while True:
                random_email = generate_random_email()
                if random_email not in existing_emails:
                    break
            
            # Assign design - alternate between design1 and design2 for better distribution
            if created_count % 2 == 0:
                assigned_design = "design1"
                design1_count += 1
            else:
                assigned_design = "design2"
                design2_count += 1
            
            # Create user
            user = User(
                school_email=random_email,
                password_hash=hash_password("testpassword123"),  # Default password for all test users
                name=user_data["name"],
                gender=user_data["gender"],
                major=user_data["major"],
                academic_year=user_data["academic_year"],
                classes_taking=user_data["classes_taking"],
                learn_best_when=user_data["learn_best_when"],
                study_snack=user_data["study_snack"],
                favorite_study_spot=user_data["favorite_study_spot"],
                mbti=user_data["mbti"],
                yap_to_study_ratio=user_data["yap_to_study_ratio"],
                email_verified=True,
                profile_completed=True,
                frontend_design=assigned_design
            )
            
            db.add(user)
            created_count += 1
            existing_emails.add(random_email)  # Add to existing emails to avoid duplicates
            print(f"Created user: {user_data['name']} ({random_email}) - Design: {assigned_design}")
        
        db.commit()
        print(f"\nSuccessfully created {created_count} test users!")
        print(f"Design1 users: {design1_count}")
        print(f"Design2 users: {design2_count}")
        print("\nTest user credentials:")
        print("Password: testpassword123")
        print("\nAll created users:")
        all_users = db.query(User).filter(User.school_email.like("%@umich.edu")).all()
        for user in all_users:
            print(f"- {user.name} ({user.school_email}) - Design: {user.frontend_design}")
        
    except Exception as e:
        print(f"Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating test users with random emails and design assignments...")
    create_test_users()
    print("\nDone! You can now test the mutual matching endpoints in Swagger.")
