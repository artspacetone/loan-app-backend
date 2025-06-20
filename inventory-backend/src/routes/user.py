from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from src.models.user import db, User
from src.schemas.validation import user_schema, users_schema, pagination_schema
from src.utils.helpers import APIResponse, require_role, log_audit, paginate_query, logger
import uuid

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@jwt_required()
@require_role(['ADMIN', 'SUPERVISOR'])
def get_users():
    """Get paginated list of users"""
    try:
        # Validate pagination parameters
        pagination_data = pagination_schema.load(request.args)
        
        # Build query
        query = User.query
        
        # Apply filters
        if request.args.get('role'):
            query = query.filter(User.role == request.args.get('role'))
        
        if request.args.get('search'):
            search_term = f"%{request.args.get('search')}%"
            query = query.filter(User.username.ilike(search_term))
        
        # Paginate
        result = paginate_query(
            query,
            pagination_data['page'],
            pagination_data['per_page'],
            pagination_data['sort_by'],
            pagination_data['sort_order']
        )
        
        # Serialize users
        users_data = users_schema.dump(result['items'])
        
        log_audit('VIEW_USERS', f"Viewed users list - page {pagination_data['page']}")
        
        return APIResponse.paginated(users_data, result['pagination'])
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Get users error: {str(e)}")
        return APIResponse.error('Failed to retrieve users', status_code=500)

@user_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
@require_role(['ADMIN', 'SUPERVISOR'])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        user = User.query.get(user_id)
        if not user:
            return APIResponse.error('User not found', status_code=404)
        
        log_audit('VIEW_USER', f"Viewed user: {user.username}")
        
        return APIResponse.success(user_schema.dump(user))
        
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return APIResponse.error('Failed to retrieve user', status_code=500)

@user_bp.route('/users', methods=['POST'])
@jwt_required()
@require_role(['ADMIN'])
def create_user():
    """Create new user"""
    try:
        # Validate input
        data = user_schema.load(request.get_json() or {})
        
        # Check if username already exists
        existing_user = User.query.filter(User.username.ilike(data['username'])).first()
        if existing_user:
            return APIResponse.error('Username already exists', status_code=409)
        
        # Create user
        user = User(
            username=data['username'],
            role=data['role'],
            company_logo=data.get('company_logo')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        log_audit('CREATE_USER', f"Created user: {user.username}")
        
        return APIResponse.success(
            user_schema.dump(user),
            "User created successfully",
            201
        )
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Create user error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to create user', status_code=500)

@user_bp.route('/users/<user_id>', methods=['PATCH'])
@jwt_required()
@require_role(['ADMIN'])
def update_user(user_id):
    """Update user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return APIResponse.error('User not found', status_code=404)
        
        # Validate input (partial update)
        data = request.get_json() or {}
        
        # Update fields
        if 'username' in data:
            # Check if new username already exists
            existing_user = User.query.filter(
                User.username.ilike(data['username']),
                User.id != user_id
            ).first()
            if existing_user:
                return APIResponse.error('Username already exists', status_code=409)
            user.username = data['username']
        
        if 'password' in data:
            if len(data['password']) < 6:
                return APIResponse.error('Password must be at least 6 characters', status_code=400)
            user.set_password(data['password'])
        
        if 'role' in data:
            if data['role'] not in ['ADMIN', 'SUPERVISOR', 'USER']:
                return APIResponse.error('Invalid role', status_code=400)
            user.role = data['role']
        
        if 'company_logo' in data:
            user.company_logo = data['company_logo']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        db.session.commit()
        
        log_audit('UPDATE_USER', f"Updated user: {user.username}")
        
        return APIResponse.success(
            user_schema.dump(user),
            "User updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Update user error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to update user', status_code=500)

@user_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
@require_role(['ADMIN'])
def delete_user(user_id):
    """Soft delete user (deactivate)"""
    try:
        current_user_id = get_jwt_identity()
        if current_user_id == user_id:
            return APIResponse.error('Cannot delete your own account', status_code=400)
        
        user = User.query.get(user_id)
        if not user:
            return APIResponse.error('User not found', status_code=404)
        
        # Soft delete by deactivating
        user.is_active = False
        db.session.commit()
        
        log_audit('DELETE_USER', f"Deactivated user: {user.username}")
        
        return APIResponse.success(message="User deactivated successfully")
        
    except Exception as e:
        logger.error(f"Delete user error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to delete user', status_code=500)
