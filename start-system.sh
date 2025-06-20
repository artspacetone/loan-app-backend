#!/bin/bash

echo "🚀 Starting Inventory Management System..."
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Create virtual environment for Python backend
echo "📦 Setting up Python backend..."
cd inventory-backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start backend in background
echo "🔧 Starting backend server..."
python src/main.py &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Install Node.js dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Start frontend
echo "🌐 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ System started successfully!"
echo "=========================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
echo "=========================================="
echo "👤 Default Login Credentials:"
echo "   Admin: admin/admin123"
echo "   Supervisor: supervisor/super123"
echo "   User: user/user123"
echo "=========================================="
echo "🔑 API Keys are pre-configured and ready to use!"
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID
