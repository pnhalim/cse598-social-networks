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

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_test_users():
    """Create test users for testing mutual matching"""
    
    # Sample data for test users
    test_users_data = [
        {
            "name": "Alice Johnson",
            "school_email": "alice@umich.edu",
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
            "school_email": "bob@umich.edu",
            "gender": "Male",
            "major": "Engineering",
            "academic_year": "Senior",
            "classes_taking": ["EECS 376", "EECS 445", "STATS 250"],
            "learn_best_when": "Late at night",
            "study_snack": "Energy drinks",
            "favorite_study_spot": "Duderstadt Center",
            "mbti": "ENTP",
            "yap_to_study_ratio": "40% yap, 60% study"
        },
        {
            "name": "Carol Davis",
            "school_email": "carol@umich.edu",
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
            "school_email": "david@umich.edu",
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
            "school_email": "emma@umich.edu",
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
            "school_email": "frank@umich.edu",
            "gender": "Male",
            "major": "Physics",
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
            "school_email": "grace@umich.edu",
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
            "school_email": "henry@umich.edu",
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
            "school_email": "ivy@umich.edu",
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
            "school_email": "jack@umich.edu",
            "gender": "Male",
            "major": "Mechanical Engineering",
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
        for user_data in test_users_data:
            if user_data["school_email"] in existing_emails:
                print(f"User {user_data['school_email']} already exists, skipping...")
                continue
            
            # Create user
            user = User(
                school_email=user_data["school_email"],
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
                frontend_design=random.choice(["design1", "design2"])  # Randomly assign design
            )
            
            db.add(user)
            created_count += 1
            print(f"Created user: {user_data['name']} ({user_data['school_email']}) - Design: {user.frontend_design}")
        
        db.commit()
        print(f"\nSuccessfully created {created_count} test users!")
        print("\nTest user credentials:")
        print("Email: [user_email]@umich.edu")
        print("Password: testpassword123")
        print("\nDesign2 users (for mutual matching):")
        design2_users = db.query(User).filter(User.frontend_design == "design2").all()
        for user in design2_users:
            print(f"- {user.name} ({user.school_email})")
        
    except Exception as e:
        print(f"Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating test users for mutual matching...")
    create_test_users()
    print("\nDone! You can now test the mutual matching endpoints in Swagger.")
