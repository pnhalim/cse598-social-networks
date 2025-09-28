@echo off
REM Study Buddy Backend Setup Script for Windows
REM This script sets up the development environment

echo 🚀 Study Buddy Backend Setup
echo ============================

REM Check if we're in the right directory
if not exist "requirements.txt" (
    echo ❌ Please run this script from the backend directory
    pause
    exit /b 1
)

REM Check Python version
echo 🐍 Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)
echo ✅ Python is available

REM Create virtual environment
echo 🔄 Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment and install dependencies
echo 🔄 Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo ✅ Dependencies installed

REM Set up environment file
echo 🔄 Setting up environment file...
if not exist ".env" (
    if exist "env_example.txt" (
        copy env_example.txt .env >nul
        echo ✅ Created .env file from template
        echo ⚠️  Please edit .env file with your email credentials
    ) else (
        echo ❌ env_example.txt not found
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file already exists
)

REM Create necessary directories
echo 🔄 Creating directories...
if not exist "email_templates" mkdir email_templates
echo ✅ Directories created

REM Initialize database
echo 🔄 Initializing database...
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('✅ Database initialized successfully')"

echo.
echo 🎉 Setup completed successfully!
echo ================================
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your email credentials
echo 2. Activate virtual environment: venv\Scripts\activate.bat
echo 3. Start the server: python app.py
echo 4. Visit API docs: http://localhost:5000/docs
echo 5. Test the API: python test_api.py
echo.
pause
