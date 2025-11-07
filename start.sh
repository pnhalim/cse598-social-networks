#!/bin/bash

# Study Buddy Startup Script
# This script starts both the frontend and backend services

set -e  # Exit on any error

echo "🚀 Starting Study Buddy Application"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check Python
if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
if [ ! -f "venv/.deps_installed" ]; then
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/.deps_installed
fi

# Check if root .env exists
cd ..
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. Creating basic .env file...${NC}"
        touch .env
        echo "# Add your environment variables here" >> .env
    fi
fi
cd backend

# Initialize database if needed
if [ ! -f "core/study_buddy.db" ]; then
    echo "🗄️  Initializing database..."
    python3 -c "
from core.database import engine
from models.models import Base
Base.metadata.create_all(bind=engine)
print('✅ Database initialized')
"
fi

# Start backend in background
echo "🚀 Starting backend server..."
python3 -m uvicorn core.app:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"

cd ..

# Frontend setup
echo ""
echo "🔧 Setting up frontend..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Frontend will use the root .env file (Vite automatically reads from project root)
# No need to create a separate frontend .env file

# Start frontend
echo "🚀 Starting frontend server..."
echo -e "${GREEN}✅ Frontend starting...${NC}"
echo "   Frontend: http://localhost:5173"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start frontend (this will block)
npm run dev

