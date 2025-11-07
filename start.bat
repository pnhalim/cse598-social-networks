@echo off
REM Study Buddy Startup Script for Windows
REM This script starts both the frontend and backend services

echo 🚀 Starting Study Buddy Application
echo ====================================

REM Check if we're in the project root
if not exist "frontend" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Backend setup
echo.
echo 🔧 Setting up backend...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo ⚠️  Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
if not exist "venv\.deps_installed" (
    echo 📦 Installing backend dependencies...
    pip install -r requirements.txt
    type nul > venv\.deps_installed
)

REM Check if root .env exists
cd ..
if not exist ".env" (
    if exist ".env.example" (
        echo ⚠️  .env file not found. Creating from template...
        copy .env.example .env >nul
        echo ⚠️  Please edit .env file with your configuration
    ) else (
        echo ⚠️  .env.example not found. Creating basic .env file...
        echo # Add your environment variables here > .env
    )
)
cd backend

REM Initialize database if needed
if not exist "core\study_buddy.db" (
    echo 🗄️  Initializing database...
    python -c "from core.database import engine; from models.models import Base; Base.metadata.create_all(bind=engine); print('✅ Database initialized')"
)

REM Start backend in background
echo 🚀 Starting backend server...
start "Study Buddy Backend" cmd /k "python -m uvicorn core.app:app --host 0.0.0.0 --port 8000 --reload"
echo ✅ Backend started in new window
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs

cd ..

REM Frontend setup
echo.
echo 🔧 Setting up frontend...
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

REM Frontend will use the root .env file (Vite automatically reads from project root)
REM No need to create a separate frontend .env file

REM Start frontend
echo 🚀 Starting frontend server...
echo ✅ Frontend starting...
echo    Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all services

call npm run dev

