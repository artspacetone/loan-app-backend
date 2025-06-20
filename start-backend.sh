#!/bin/bash

echo "🔧 Starting Backend Server..."

# Kill any existing process on port 5000
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 Killing existing process on port 5000..."
    lsof -ti:5000 | xargs kill -9
    sleep 2
fi

# Navigate to backend directory
cd inventory-backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

# Create database directory
mkdir -p src/database

# Start the server
echo "🚀 Starting Flask server on port 5000..."
python src/main.py
