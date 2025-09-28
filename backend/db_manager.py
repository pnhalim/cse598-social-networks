#!/usr/bin/env python3
"""
Database management script for Study Buddy
Provides easy command-line access to view and modify the database
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import User, Base
from database import SQLALCHEMY_DATABASE_URL

def create_session():
    """Create a database session"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    return Session()

def list_users():
    """List all users in the database"""
    session = create_session()
    try:
        users = session.query(User).all()
        if not users:
            print("No users found in the database.")
            return
        
        print(f"\nFound {len(users)} users:")
        print("-" * 80)
        for user in users:
            print(f"ID: {user.id}")
            print(f"Name: {user.name}")
            print(f"Email: {user.school_email}")
            print(f"Major: {user.major}")
            print(f"Academic Year: {user.academic_year}")
            print(f"Frontend Design: {user.frontend_design}")
            print(f"Email Verified: {user.email_verified}")
            print(f"Created: {user.created_at}")
            print("-" * 80)
    finally:
        session.close()

def get_user_by_id(user_id):
    """Get a specific user by ID"""
    session = create_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"User with ID {user_id} not found.")
            return
        
        print(f"\nUser Details (ID: {user.id}):")
        print("-" * 50)
        print(f"Name: {user.name}")
        print(f"Gender: {user.gender}")
        print(f"Major: {user.major}")
        print(f"Email: {user.school_email}")
        print(f"Academic Year: {user.academic_year}")
        print(f"Frontend Design: {user.frontend_design}")
        print(f"Email Verified: {user.email_verified}")
        print(f"Profile Picture: {user.profile_picture}")
        print(f"Classes Taking: {user.classes_taking}")
        print(f"Classes Taken: {user.classes_taken}")
        print(f"Learn Best When: {user.learn_best_when}")
        print(f"Study Snack: {user.study_snack}")
        print(f"Favorite Study Spot: {user.favorite_study_spot}")
        print(f"MBTI: {user.mbti}")
        print(f"Yap to Study Ratio: {user.yap_to_study_ratio}")
        print(f"Created: {user.created_at}")
        print(f"Updated: {user.updated_at}")
    finally:
        session.close()

def get_user_by_email(email):
    """Get a specific user by email"""
    session = create_session()
    try:
        user = session.query(User).filter(User.school_email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return
        
        get_user_by_id(user.id)
    finally:
        session.close()

def delete_user(user_id):
    """Delete a user by ID"""
    session = create_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"User with ID {user_id} not found.")
            return
        
        print(f"Deleting user: {user.name} ({user.school_email})")
        confirm = input("Are you sure? (y/N): ")
        if confirm.lower() == 'y':
            session.delete(user)
            session.commit()
            print("User deleted successfully.")
        else:
            print("Deletion cancelled.")
    finally:
        session.close()

def update_user_email_verification(user_id, verified=True):
    """Update user's email verification status"""
    session = create_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"User with ID {user_id} not found.")
            return
        
        user.email_verified = verified
        session.commit()
        print(f"User {user.name}'s email verification status updated to: {verified}")
    finally:
        session.close()

def run_sql_query(query):
    """Run a custom SQL query"""
    session = create_session()
    try:
        result = session.execute(text(query))
        if result.returns_rows:
            rows = result.fetchall()
            if rows:
                # Print column names
                print("\n".join([str(row) for row in rows]))
            else:
                print("No results found.")
        else:
            session.commit()
            print("Query executed successfully.")
    except Exception as e:
        print(f"Error executing query: {e}")
    finally:
        session.close()

def show_help():
    """Show help information"""
    print("""
Study Buddy Database Manager

Commands:
  list                    - List all users
  get <id>               - Get user by ID
  email <email>          - Get user by email
  delete <id>            - Delete user by ID
  verify <id>            - Mark user email as verified
  unverify <id>          - Mark user email as unverified
  sql <query>            - Run custom SQL query
  help                   - Show this help
  quit                   - Exit

Examples:
  python db_manager.py list
  python db_manager.py get 1
  python db_manager.py email john@umich.edu
  python db_manager.py delete 1
  python db_manager.py verify 1
  python db_manager.py sql "SELECT COUNT(*) FROM users"
""")

def main():
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "list":
        list_users()
    elif command == "get" and len(sys.argv) > 2:
        get_user_by_id(int(sys.argv[2]))
    elif command == "email" and len(sys.argv) > 2:
        get_user_by_email(sys.argv[2])
    elif command == "delete" and len(sys.argv) > 2:
        delete_user(int(sys.argv[2]))
    elif command == "verify" and len(sys.argv) > 2:
        update_user_email_verification(int(sys.argv[2]), True)
    elif command == "unverify" and len(sys.argv) > 2:
        update_user_email_verification(int(sys.argv[2]), False)
    elif command == "sql" and len(sys.argv) > 2:
        query = " ".join(sys.argv[2:])
        run_sql_query(query)
    elif command == "help":
        show_help()
    else:
        print("Invalid command. Use 'help' for available commands.")

if __name__ == "__main__":
    main()
