#!/usr/bin/env python3
"""
Auto-setup script for the inventory backend
"""
import os
import sys
import sqlite3
import subprocess
import time
from pathlib import Path
from werkzeug.security import generate_password_hash

class AutoSetup:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.db_path = self.base_dir / "database" / "app.db"
        self.venv_path = self.base_dir.parent / "venv"
        
    def log(self, message, level="INFO"):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def check_python_version(self):
        """Check if Python version is compatible"""
        if sys.version_info < (3, 8):
            self.log("Python 3.8 or higher is required", "ERROR")
            return False
        self.log(f"Python version: {sys.version}", "SUCCESS")
        return True
        
    def create_virtual_environment(self):
        """Create virtual environment if it doesn't exist"""
        if self.venv_path.exists():
            self.log("Virtual environment already exists", "INFO")
            return True
            
        try:
            self.log("Creating virtual environment...", "INFO")
            subprocess.run([sys.executable, "-m", "venv", str(self.venv_path)], check=True)
            self.log("Virtual environment created successfully", "SUCCESS")
            return True
        except subprocess.CalledProcessError as e:
            self.log(f"Failed to create virtual environment: {e}", "ERROR")
            return False
            
    def install_dependencies(self):
        """Install Python dependencies"""
        try:
            # Determine pip path
            if os.name == 'nt':  # Windows
                pip_path = self.venv_path / "Scripts" / "pip.exe"
            else:  # Unix/Linux/macOS
                pip_path = self.venv_path / "bin" / "pip"
                
            if not pip_path.exists():
                self.log("pip not found in virtual environment", "ERROR")
                return False
                
            # Install requirements
            requirements_path = self.base_dir.parent / "requirements.txt"
            if requirements_path.exists():
                self.log("Installing dependencies...", "INFO")
                subprocess.run([str(pip_path), "install", "-r", str(requirements_path)], check=True)
                self.log("Dependencies installed successfully", "SUCCESS")
            else:
                self.log("requirements.txt not found", "WARNING")
                
            return True
        except subprocess.CalledProcessError as e:
            self.log(f"Failed to install dependencies: {e}", "ERROR")
            return False
            
    def setup_database(self):
        """Setup SQLite database with initial data"""
        try:
            # Create database directory
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Connect to database
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Create tables
            self.log("Creating database tables...", "INFO")
            
            # Users table
            cursor.execute('''
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
            cursor.execute('''
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
            cursor.execute('''
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
            
            # Insert default users
            self.log("Creating default users...", "INFO")
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
                cursor.execute('SELECT id FROM users WHERE username = ?', (user_data['username'],))
                if not cursor.fetchone():
                    password_hash = generate_password_hash(user_data['password'])
                    cursor.execute('''
                        INSERT INTO users (username, email, password_hash, full_name, role)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        user_data['username'],
                        user_data['email'],
                        password_hash,
                        user_data['full_name'],
                        user_data['role']
                    ))
                    self.log(f"Created user: {user_data['username']}", "SUCCESS")
            
            # Insert sample inventory items
            self.log("Creating sample inventory items...", "INFO")
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
                cursor.execute('SELECT id FROM inventory_items WHERE name = ?', (item['name'],))
                if not cursor.fetchone():
                    cursor.execute('''
                        INSERT INTO inventory_items 
                        (name, description, category, quantity, min_quantity, unit, price, location, supplier)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        item['name'], item['description'], item['category'],
                        item['quantity'], item['min_quantity'], item['unit'],
                        item['price'], item['location'], item['supplier']
                    ))
                    self.log(f"Created item: {item['name']}", "SUCCESS")
            
            conn.commit()
            conn.close()
            
            self.log("Database setup completed successfully", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"Database setup failed: {e}", "ERROR")
            return False
            
    def create_config_files(self):
        """Create configuration files"""
        try:
            # Create .env file
            env_content = """# Auto-generated configuration
JWT_SECRET_KEY=inventory-management-jwt-secret-key-2024
API_KEY=inventory-api-key-2024
ENCRYPTION_KEY=inventory-encryption-key-2024
SESSION_SECRET=inventory-session-secret-2024
DATABASE_URL=sqlite:///./database/app.db
FLASK_ENV=development
DEBUG=true
"""
            env_path = self.base_dir.parent / ".env"
            with open(env_path, "w") as f:
                f.write(env_content)
            self.log("Configuration files created", "SUCCESS")
            return True
        except Exception as e:
            self.log(f"Failed to create config files: {e}", "ERROR")
            return False
            
    def run_setup(self):
        """Run the complete setup process"""
        self.log("Starting auto-setup...", "INFO")
        
        steps = [
            ("Checking Python version", self.check_python_version),
            ("Creating virtual environment", self.create_virtual_environment),
            ("Installing dependencies", self.install_dependencies),
            ("Setting up database", self.setup_database),
            ("Creating configuration files", self.create_config_files),
        ]
        
        for step_name, step_func in steps:
            self.log(f"Step: {step_name}", "INFO")
            if not step_func():
                self.log(f"Setup failed at step: {step_name}", "ERROR")
                return False
                
        self.log("Auto-setup completed successfully!", "SUCCESS")
        self.log("You can now run: python src/main.py", "INFO")
        return True

if __name__ == "__main__":
    setup = AutoSetup()
    success = setup.run_setup()
    sys.exit(0 if success else 1)
