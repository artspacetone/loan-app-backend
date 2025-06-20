#!/bin/bash

echo "🔧 Quick Fix - Starting Inventory System"
echo "========================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check requirements
echo "🔍 Checking requirements..."

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js and try again."
    exit 1
fi

echo "✅ All requirements satisfied"

# Make scripts executable
chmod +x start-backend-fixed.sh

# Start backend
echo ""
echo "🔧 Starting backend server..."
echo "This will open in a new terminal window/tab"

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && ./start-backend-fixed.sh"'
# For Linux with gnome-terminal
elif command_exists gnome-terminal; then
    gnome-terminal -- bash -c "cd $(pwd) && ./start-backend-fixed.sh; exec bash"
# For Linux with xterm
elif command_exists xterm; then
    xterm -e "cd $(pwd) && ./start-backend-fixed.sh; bash" &
# Fallback - run in background
else
    echo "🔄 Starting backend in background..."
    ./start-backend-fixed.sh &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
fi

# Wait a moment for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
echo "🔍 Checking backend status..."
for i in {1..10}; do
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "✅ Backend is running!"
        break
    else
        echo "⏳ Waiting for backend... ($i/10)"
        sleep 2
    fi
done

# Start frontend
echo ""
echo "🌐 Starting frontend..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🚀 Starting Next.js development server..."
npm run dev

echo ""
echo "🎉 System should be ready!"
echo "========================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📊 Health: http://localhost:5000/api/health"
