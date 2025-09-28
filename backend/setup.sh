#!/bin/bash

# Study Buddy Backend Setup Script
# This script sets up the development environment

set -e  # Exit on any error

echo "🚀 Study Buddy Backend Setup"
echo "============================"

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check Python version
echo "🐍 Checking Python version..."
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
required_version="3.7"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Python $python_version is compatible"
else
    echo "❌ Python 3.7 or higher is required"
    exit 1
fi

# Create virtual environment
echo "🔄 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
echo "🔄 Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Dependencies installed"

# Set up environment file
echo "🔄 Setting up environment file..."
if [ ! -f ".env" ]; then
    if [ -f "env_example.txt" ]; then
        cp env_example.txt .env
        echo "✅ Created .env file from template"
        echo "⚠️  Please edit .env file with your email credentials"
    else
        echo "❌ env_example.txt not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "🔄 Creating directories..."
mkdir -p email_templates
echo "✅ Directories created"

# Initialize database
echo "🔄 Initializing database..."
python3 -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('✅ Database initialized successfully')
"

echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your email credentials"
echo "2. Activate virtual environment: source venv/bin/activate"
echo "3. Start the server: python app.py"
echo "4. Visit API docs: http://localhost:5000/docs"
echo "5. Test the API: python test_api.py"
echo ""
