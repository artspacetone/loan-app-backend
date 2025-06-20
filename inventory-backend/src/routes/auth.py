from flask import Blueprint, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from marshmallow import ValidationError
from src.models.user import db, User
from src.schemas.validation import login_schema, user_schema
from src.utils.helpers import APIResponse, log_audit, logger
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

auth_bp = Blueprint('auth', __name__)

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@auth_bp.route('/login', methods=['POST'])  # Changed from '/auth/login' to '/login'
@limiter.limit("5 per minute")
def login():
    """Authenticate user and return JWT tokens"""
    try:
        # Get JSON data
        data = request.get_json()
        if not data:
            return APIResponse.error('No data provided', status_code=400)
            
        # Validate input
        data = login_schema.load(data)
        
        # Find user (case-insensitive username)
        user = User.query.filter(
            User.username.ilike(data['username']),
            User.is_active == True
        ).first()
        
        # Check credentials
        if not user or not user.check_password(data['password']):
            log_audit('LOGIN_FAILED', f"Failed login attempt for username: {data['username']}")
            return APIResponse.error('Invalid credentials', status_code=401)
        
        # Update last login
        user.update_last_login()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Log successful login
        log_audit('LOGIN_SUCCESS', f"Successful login for user: {user.username}")
        
        return APIResponse.success({
            'user': user.to_dict(),
            'token': access_token,  # Changed from 'access_token' to 'token' to match frontend
            'refresh_token': refresh_token
        }, "Login successful")
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return APIResponse.error('Login failed', status_code=500)

@auth_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return APIResponse.error('User not found or inactive', status_code=401)
        
        access_token = create_access_token(identity=user_id)
        
        return APIResponse.success({
            'access_token': access_token
        }, "Token refreshed")
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return APIResponse.error('Token refresh failed', status_code=500)

@auth_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return APIResponse.error('User not found or inactive', status_code=401)
        
        return APIResponse.success(user.to_dict(), "User information retrieved")
        
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return APIResponse.error('Failed to get user information', status_code=500)

@auth_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)"""
    try:
        user_id = get_jwt_identity()
        log_audit('LOGOUT', f"User logged out: {user_id}")
        
        return APIResponse.success(message="Logged out successfully")
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return APIResponse.error('Logout failed', status_code=500)
