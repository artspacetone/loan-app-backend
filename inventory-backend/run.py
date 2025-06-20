#!/usr/bin/env python3
"""
Main entry point for the Flask application
Run this file to start the server
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import create_app

# Create Flask app
app = create_app()

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    print("🚀 Starting Inventory Management Backend...")
    print(f"📍 Server will run on: http://localhost:{port}")
    print("📊 API endpoints available at: /api")
    print("🔐 Default admin login: admin / admin123")
    print("-" * 50)
    
    # Run the application
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
