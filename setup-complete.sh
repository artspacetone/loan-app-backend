#!/bin/bash

echo "🚀 Setting up Inventory Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your database URL and JWT secret"
    echo "   DATABASE_URL=your_neon_database_url"
    echo "   JWT_SECRET=your_super_secret_jwt_key"
    exit 1
fi

echo "🔧 Setting up database..."
# Run database setup
curl -X POST http://localhost:3000/api/setup 2>/dev/null || echo "⚠️  Database setup will run when server starts"

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env.local with your database URL"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "🔑 Default login credentials:"
echo "   Admin: admin / admin123"
echo "   Supervisor: supervisor / super123"
echo "   User: user / user123"
