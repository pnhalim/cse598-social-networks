#!/usr/bin/env python3
"""
Setup script for Study Buddy Backend
This script helps set up the development environment and initial configuration.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python 3.7 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def create_virtual_environment():
    """Create virtual environment if it doesn't exist"""
    venv_path = Path("venv")
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    return run_command("python -m venv venv", "Creating virtual environment")

def install_dependencies():
    """Install Python dependencies"""
    # Determine the correct pip command based on OS
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip"
    
    return run_command(f"{pip_cmd} install -r requirements.txt", "Installing dependencies")

def setup_environment_file():
    """Set up environment file from template"""
    env_file = Path(".env")
    env_example = Path("env_example.txt")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if not env_example.exists():
        print("❌ env_example.txt not found")
        return False
    
    # Copy example to .env
    shutil.copy(env_example, env_file)
    print("✅ Created .env file from template")
    print("⚠️  Please edit .env file with your email credentials")
    return True

def create_directories():
    """Create necessary directories"""
    directories = ["email_templates"]
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(exist_ok=True)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"✅ Directory already exists: {directory}")
    
    return True

def initialize_database():
    """Initialize the database"""
    print("🗄️  Initializing database...")
    try:
        # Import and create database
        sys.path.insert(0, str(Path.cwd()))
        from database import engine
        from models import Base
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def print_next_steps():
    """Print next steps for the user"""
    print("\n" + "="*60)
    print("🎉 Setup completed successfully!")
    print("="*60)
    print("\n📋 Next steps:")
    print("1. Edit .env file with your email credentials:")
    print("   - Set MAIL_USERNAME to your email")
    print("   - Set MAIL_PASSWORD to your app password (not regular password)")
    print("   - For Gmail: Enable 2FA and create an App Password")
    print("\n2. Activate virtual environment:")
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/macOS
        print("   source venv/bin/activate")
    print("\n3. Start the server:")
    print("   python app.py")
    print("\n4. Visit the API documentation:")
    print("   http://localhost:5000/docs")
    print("\n5. Test the API:")
    print("   python test_api.py")
    print("\n" + "="*60)

def main():
    """Main setup function"""
    print("🚀 Study Buddy Backend Setup")
    print("="*40)
    
    # Check if we're in the right directory
    if not Path("requirements.txt").exists():
        print("❌ Please run this script from the backend directory")
        sys.exit(1)
    
    steps = [
        ("Checking Python version", check_python_version),
        ("Creating virtual environment", create_virtual_environment),
        ("Installing dependencies", install_dependencies),
        ("Setting up environment file", setup_environment_file),
        ("Creating directories", create_directories),
        ("Initializing database", initialize_database),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Setup failed at: {step_name}")
            sys.exit(1)
    
    print_next_steps()

if __name__ == "__main__":
    main()
