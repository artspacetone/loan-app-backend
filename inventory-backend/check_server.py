#!/usr/bin/env python3
"""
Script untuk memeriksa status server dan koneksi
"""
import requests
import json
import sys
import os

def check_server_health():
    """Check if server is running"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and healthy")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running on port 5000?")
        return False
    except requests.exceptions.Timeout:
        print("❌ Server connection timeout")
        return False
    except Exception as e:
        print(f"❌ Error checking server: {e}")
        return False

def test_login():
    """Test login endpoint"""
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(
            'http://localhost:5000/api/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login endpoint working correctly")
            return True
        else:
            print("❌ Login endpoint has issues")
            return False
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return False

def check_database():
    """Check if database exists and has data"""
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
        if os.path.exists(db_path):
            print(f"✅ Database exists at: {db_path}")
            print(f"Database size: {os.path.getsize(db_path)} bytes")
            return True
        else:
            print(f"❌ Database not found at: {db_path}")
            return False
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

def main():
    print("🔍 Checking Inventory Management System Backend...")
    print("=" * 50)
    
    # Check server health
    server_ok = check_server_health()
    print()
    
    # Check database
    db_ok = check_database()
    print()
    
    # Test login if server is running
    if server_ok:
        login_ok = test_login()
    else:
        print("⏭️  Skipping login test (server not running)")
        login_ok = False
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY:")
    print(f"Server Health: {'✅' if server_ok else '❌'}")
    print(f"Database: {'✅' if db_ok else '❌'}")
    print(f"Login Test: {'✅' if login_ok else '❌'}")
    
    if not server_ok:
        print("\n🚨 NEXT STEPS:")
        print("1. Start the backend server:")
        print("   cd inventory-backend")
        print("   python src/main.py")
        print("\n2. Check for any error messages in the terminal")
        print("3. Make sure port 5000 is not being used by another application")
    
    return server_ok and db_ok and login_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
