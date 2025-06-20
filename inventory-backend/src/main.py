import os
import sys
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import jwt
import datetime
from functools import wraps
import logging
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from src.config import get_config
    config = get_config()
except ImportError:
    logger.warning("Config module not found, using default configuration")
    class DefaultConfig:
        JWT_SECRET_KEY = 'inventory-management-jwt-secret-key-2024'
        API_KEY = 'inventory-api-key-2024'
        CORS_ORIGINS = ["*"]
    config = DefaultConfig()

# Initialize Flask app
app = Flask(__name__)

# Configure app with pre-set API keys
app.config['SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY

# Enable CORS with more permissive settings for development
CORS(app, 
     origins=["*"],  # Allow all origins for development
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Database path
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database', 'app.db')

def get_db():
    """Get database connection"""
    if 'db' not in g:
        os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db_connection(error):
    close_db()

def init_db():
    """Initialize database with tables and default data"""
    logger.info("Initializing database...")
    db = get_db()
    
    try:
        # Users table
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Inventory items table
        db.execute('''
            CREATE TABLE IF NOT EXISTS inventory_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT,
                quantity INTEGER DEFAULT 0,
                min_quantity INTEGER DEFAULT 5,
                unit TEXT DEFAULT 'pcs',
                price REAL DEFAULT 0.0,
                location TEXT,
                status TEXT DEFAULT 'available',
                barcode TEXT,
                supplier TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Transactions table
        db.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                item_id INTEGER,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                requested_by TEXT NOT NULL,
                approved_by TEXT,
                status TEXT DEFAULT 'pending',
                reason TEXT,
                notes TEXT,
                priority TEXT DEFAULT 'normal',
                request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approval_date TIMESTAMP,
                completed_date TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES inventory_items (id)
            )
        ''')
        
        # Create default users with pre-configured credentials
        default_users = [
            {
                'username': 'admin',
                'email': 'admin@inventory.com',
                'password': 'admin123',
                'full_name': 'System Administrator',
                'role': 'admin'
            },
            {
                'username': 'supervisor',
                'email': 'supervisor@inventory.com',
                'password': 'super123',
                'full_name': 'Inventory Supervisor',
                'role': 'supervisor'
            },
            {
                'username': 'user',
                'email': 'user@inventory.com',
                'password': 'user123',
                'full_name': 'Regular User',
                'role': 'user'
            }
        ]
        
        for user_data in default_users:
            existing = db.execute('SELECT id FROM users WHERE username = ?', (user_data['username'],)).fetchone()
            if not existing:
                password_hash = generate_password_hash(user_data['password'])
                db.execute('''
                    INSERT INTO users (username, email, password_hash, full_name, role)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    user_data['username'],
                    user_data['email'],
                    password_hash,
                    user_data['full_name'],
                    user_data['role']
                ))
                logger.info(f"Created user: {user_data['username']}")
        
        # Create sample inventory items
        sample_items = [
            {
                'name': 'Laptop Dell Inspiron',
                'description': 'Dell Inspiron 15 3000 Series',
                'category': 'Electronics',
                'quantity': 25,
                'min_quantity': 5,
                'unit': 'pcs',
                'price': 8500000.0,
                'location': 'Warehouse A-1',
                'supplier': 'Dell Indonesia'
            },
            {
                'name': 'Office Chair',
                'description': 'Ergonomic office chair with lumbar support',
                'category': 'Furniture',
                'quantity': 50,
                'min_quantity': 10,
                'unit': 'pcs',
                'price': 1200000.0,
                'location': 'Warehouse B-2',
                'supplier': 'Office Furniture Co'
            },
            {
                'name': 'A4 Paper',
                'description': 'White A4 paper 80gsm',
                'category': 'Stationery',
                'quantity': 100,
                'min_quantity': 20,
                'unit': 'ream',
                'price': 45000.0,
                'location': 'Storage Room C',
                'supplier': 'Paper Supply Ltd'
            }
        ]
        
        for item in sample_items:
            existing = db.execute('SELECT id FROM inventory_items WHERE name = ?', (item['name'],)).fetchone()
            if not existing:
                db.execute('''
                    INSERT INTO inventory_items 
                    (name, description, category, quantity, min_quantity, unit, price, location, supplier)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    item['name'], item['description'], item['category'],
                    item['quantity'], item['min_quantity'], item['unit'],
                    item['price'], item['location'], item['supplier']
                ))
        
        db.commit()
        logger.info("Database initialized successfully")
        
        # Verify users were created
        users = db.execute('SELECT username, role FROM users').fetchall()
        logger.info(f"Users in database: {[dict(user) for user in users]}")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.error(traceback.format_exc())
        raise

# JWT token validation decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
            current_user_role = data.get('role', 'user')
            g.current_user_id = current_user_id
            g.current_user_role = current_user_role
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        db = get_db()
        db.execute('SELECT 1').fetchone()
        
        # Check users count
        user_count = db.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
        
        return jsonify({
            'success': True,
            'message': 'Inventory Management System API is running',
            'version': '1.0.0',
            'status': 'healthy',
            'timestamp': datetime.datetime.now().isoformat(),
            'database': 'connected',
            'users_count': user_count
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'success': False,
            'message': 'Health check failed',
            'error': str(e),
            'status': 'unhealthy'
        }), 500

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Inventory Management System API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'login': '/api/auth/login',
            'inventory': '/api/inventory',
            'transactions': '/api/transactions',
            'dashboard': '/api/dashboard/stats'
        }
    })

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        logger.info("Login attempt received")
        
        # Get request data
        data = request.get_json()
        logger.info(f"Request data: {data}")
        
        if not data:
            logger.error("No data provided in request")
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')
        
        logger.info(f"Login attempt for username: {username}")
        
        if not username or not password:
            logger.error("Username or password missing")
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        # Query database
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE username = ? AND is_active = 1', 
            (username,)
        ).fetchone()
        
        logger.info(f"User found in database: {user is not None}")
        
        if user:
            logger.info(f"User details: id={user['id']}, username={user['username']}, role={user['role']}")
            password_check = check_password_hash(user['password_hash'], password)
            logger.info(f"Password check result: {password_check}")
        
        if user and check_password_hash(user['password_hash'], password):
            # Create JWT token
            token_payload = {
                'user_id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }
            
            token = jwt.encode(token_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
            logger.info(f"Token created for user: {username}")
            
            response_data = {
                'success': True,
                'data': {
                    'token': token,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'email': user['email'],
                        'fullName': user['full_name'],
                        'role': user['role']
                    }
                },
                'message': 'Login successful'
            }
            
            logger.info("Login successful")
            return jsonify(response_data)
        else:
            logger.error(f"Invalid credentials for username: {username}")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Login failed', 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user_id):
    return jsonify({'success': True, 'message': 'Logout successful'})

# Dashboard stats endpoint
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user_id):
    try:
        db = get_db()
        
        # Total items
        total_items = db.execute('SELECT COUNT(*) as count FROM inventory_items').fetchone()['count']
        
        # Low stock items
        low_stock_items = db.execute(
            'SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= min_quantity'
        ).fetchone()['count']
        
        # Pending transactions
        pending_transactions = db.execute(
            'SELECT COUNT(*) as count FROM transactions WHERE status = "pending"'
        ).fetchone()['count']
        
        # Completed transactions this month
        completed_transactions = db.execute('''
            SELECT COUNT(*) as count FROM transactions 
            WHERE status = "completed" 
            AND strftime('%Y-%m', completed_date) = strftime('%Y-%m', 'now')
        ''').fetchone()['count']
        
        # Recent transactions
        recent_transactions_raw = db.execute('''
            SELECT * FROM transactions 
            ORDER BY request_date DESC 
            LIMIT 5
        ''').fetchall()
        
        recent_transactions = []
        for trans in recent_transactions_raw:
            recent_transactions.append({
                'id': trans['id'],
                'type': trans['type'],
                'itemName': trans['item_name'],
                'quantity': trans['quantity'],
                'status': trans['status'],
                'requestDate': trans['request_date'],
                'requestedBy': trans['requested_by']
            })
        
        return jsonify({
            'success': True,
            'data': {
                'totalItems': total_items,
                'lowStockItems': low_stock_items,
                'pendingTransactions': pending_transactions,
                'completedTransactions': completed_transactions,
                'recentTransactions': recent_transactions
            }
        })
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get dashboard stats', 'error': str(e)}), 500

# User profile endpoint
@app.route('/api/users/profile', methods=['GET'])
@token_required
def get_user_profile(current_user_id):
    try:
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE id = ?', (current_user_id,)).fetchone()
        
        if user:
            return jsonify({
                'success': True,
                'data': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'fullName': user['full_name'],
                    'role': user['role'],
                    'isActive': bool(user['is_active']),
                    'createdAt': user['created_at'],
                    'updatedAt': user['updated_at']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
    except Exception as e:
        logger.error(f"Get user profile error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get user profile', 'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting Inventory Management System Backend...")
    print("=" * 60)
    print(f"🌐 Server: http://localhost:5000")
    print(f"📊 Health: http://localhost:5000/api/health")
    print(f"🔑 JWT Secret: {app.config['JWT_SECRET_KEY']}")
    print("=" * 60)
    print("👤 Default Users:")
    print("   Admin: admin/admin123")
    print("   Supervisor: supervisor/super123")
    print("   User: user/user123")
    print("=" * 60)
    
    # Initialize database
    with app.app_context():
        try:
            init_db()
            print("✅ Database initialized with sample data")
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            sys.exit(1)
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)
