#!/bin/bash

echo "🚀 Starting Backend Server (Fixed Version)..."

# Kill any existing process on port 5000
echo "🔄 Checking for existing processes on port 5000..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🔄 Killing existing process on port 5000..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Navigate to backend directory
if [ ! -d "inventory-backend" ]; then
    echo "❌ inventory-backend directory not found!"
    echo "Please make sure you're in the correct directory."
    exit 1
fi

cd inventory-backend

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed!"
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade requirements
echo "📦 Installing/upgrading requirements..."
pip install --upgrade pip
pip install -r requirements.txt

# Create database directory
mkdir -p src/database

# Check if main.py exists
if [ ! -f "src/main.py" ]; then
    echo "❌ src/main.py not found!"
    exit 1
fi

# Start the server
echo "🚀 Starting Flask server on port 5000..."
echo "🌐 Backend will be available at: http://localhost:5000"
echo "📊 Health check: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"

python src/main.py
