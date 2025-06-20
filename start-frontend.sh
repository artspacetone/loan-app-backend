#!/bin/bash

echo "🌐 Starting Frontend Server..."

# Kill any existing process on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 Killing existing process on port 3000..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start the development server
echo "🚀 Starting Next.js server on port 3000..."
npm run dev
