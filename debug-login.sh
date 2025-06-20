#!/bin/bash

echo "🔍 DEBUGGING LOGIN SYSTEM"
echo "=========================="

# Check if backend is running
echo "1. Checking backend health..."
curl -s http://localhost:5000/api/health | jq '.' || echo "❌ Backend not responding"

echo -e "\n2. Testing login with admin credentials..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v

echo -e "\n3. Checking database users..."
python3 -c "
import sqlite3
import os

db_path = 'inventory-backend/src/database/app.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT username, role FROM users')
    users = cursor.fetchall()
    print('Users in database:', users)
    conn.close()
else:
    print('Database file not found at:', db_path)
"

echo -e "\n4. Checking backend logs..."
echo "Check the backend terminal for detailed logs"

echo -e "\n5. Frontend connection test..."
echo "Open browser console at http://localhost:3000/login to see detailed logs"
