#!/bin/bash

echo "🚀 Setting up Inventory Management Backend..."
echo "============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create database directory
echo "🗄️ Creating database directory..."
mkdir -p src/database

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p src/uploads

# Set environment variables
echo "🔐 Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from example"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Backend setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Run the server: python run.py"
echo "3. Or run with auto-reload: python run.py"
echo ""
echo "🌐 Server will be available at: http://localhost:5000"
echo "📊 API documentation: http://localhost:5000/api"
echo "🔐 Default admin login: admin / admin123"
echo ""
echo "🔧 To seed sample data, run:"
echo "   python src/scripts/seed_data.py"
