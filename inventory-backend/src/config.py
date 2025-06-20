import os

class Config:
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'inventory-management-jwt-secret-key-2024')
    
    # API Configuration
    API_KEY = os.environ.get('API_KEY', 'inventory-api-key-2024')
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-frontend-domain.com"
    ]
    
    # Database Configuration
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    
    # Flask Configuration
    SECRET_KEY = JWT_SECRET_KEY
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = ["*"]  # Allow all origins in development

class ProductionConfig(Config):
    DEBUG = False

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        return ProductionConfig()
    return DevelopmentConfig()
