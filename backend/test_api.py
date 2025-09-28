#!/usr/bin/env python3
"""
Simple test script for the Study Buddy FastAPI
Run this after starting the FastAPI server to test the endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_root_endpoint():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    response = requests.get("http://localhost:5000/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_user_registration():
    """Test user registration"""
    print("Testing user registration...")
    
    user_data = {
        "name": "John Doe",
        "gender": "Male",
        "major": "Computer Science",
        "school_email": "johndoe@umich.edu",
        "academic_year": "Senior",
        "profile_picture": "https://example.com/profile.jpg",
        "classes_taking": '["EECS 281", "EECS 370", "MATH 214"]',
        "classes_taken": '["EECS 183", "EECS 203", "MATH 116"]',
        "learn_best_when": "I learn best when I have a quiet environment and can take breaks every hour.",
        "study_snack": "My go-to study snack is trail mix because it gives me energy without making me sleepy.",
        "favorite_study_spot": "Favorite study spot: Hatcher Library because it's quiet and has great natural light.",
        "mbti": "INTJ",
        "yap_to_study_ratio": "30:70"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        return response.json()['user']['id']
    return None

def test_get_user(user_id):
    """Test getting user by ID"""
    print(f"Testing get user by ID ({user_id})...")
    response = requests.get(f"{BASE_URL}/user/{user_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_get_user_by_email():
    """Test getting user by email"""
    print("Testing get user by email...")
    response = requests.get(f"{BASE_URL}/user/email/johndoe@umich.edu")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_update_user(user_id):
    """Test updating user profile"""
    print(f"Testing update user ({user_id})...")
    
    update_data = {
        "name": "John Smith",
        "major": "Data Science",
        "mbti": "ENFP",
        "yap_to_study_ratio": "50:50"
    }
    
    response = requests.put(f"{BASE_URL}/user/{user_id}", json=update_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_verify_email(user_id):
    """Test manual email verification"""
    print(f"Testing manual email verification ({user_id})...")
    response = requests.post(f"{BASE_URL}/user/{user_id}/verify-email")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_verification_status():
    """Test checking verification status"""
    print("Testing verification status...")
    response = requests.get(f"{BASE_URL}/users")
    if response.status_code == 200:
        users = response.json()['users']
        for user in users:
            status = user.get('email_verified')
            if status is None:
                status_text = "Pending"
            elif status is True:
                status_text = "Verified"
            else:
                status_text = "Rejected"
            print(f"User {user['name']}: {status_text}")
    print()

def test_invalid_email():
    """Test registration with invalid email"""
    print("Testing registration with invalid email...")
    
    user_data = {
        "name": "Jane Doe",
        "gender": "Female",
        "major": "Psychology",
        "school_email": "jane@gmail.com",  # Invalid email
        "academic_year": "Junior"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

if __name__ == "__main__":
    print("=== Study Buddy FastAPI Test Suite ===\n")
    
    # Test root endpoint
    test_root_endpoint()
    
    # Test health check
    test_health_check()
    
    # Test user registration
    user_id = test_user_registration()
    
    if user_id:
        # Test getting user
        test_get_user(user_id)
        test_get_user_by_email()
        
        # Test updating user
        test_update_user(user_id)
        
        # Test email verification
        test_verify_email(user_id)
    
    # Test verification status
    test_verification_status()
    
    # Test invalid email
    test_invalid_email()
    
    print("=== Test Suite Complete ===")
