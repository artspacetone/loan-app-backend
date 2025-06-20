import logging
import uuid
from datetime import datetime
from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIResponse:
    """Standardized API response helper"""
    
    @staticmethod
    def success(data=None, message="Success", status_code=200):
        """Return success response"""
        response = {
            "success": True,
            "message": message
        }
        if data is not None:
            response["data"] = data
        return jsonify(response), status_code
    
    @staticmethod
    def error(message="Error occurred", details=None, status_code=400):
        """Return error response"""
        response = {
            "success": False,
            "message": message
        }
        if details:
            response["details"] = details
        return jsonify(response), status_code
    
    @staticmethod
    def paginated(data, pagination_info):
        """Return paginated response"""
        return jsonify({
            "success": True,
            "data": data,
            "pagination": pagination_info
        }), 200

def require_role(allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from src.models.user import User
            
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_active:
                return APIResponse.error("User not found or inactive", status_code=401)
            
            if user.role not in allowed_roles:
                return APIResponse.error("Insufficient permissions", status_code=403)
            
            g.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_audit(action, details=None, transaction_id=None):
    """Log audit trail"""
    try:
        from src.models.user import db, AuditLog
        
        user_id = get_jwt_identity()
        if not user_id:
            return
        
        audit_log = AuditLog(
            user_id=user_id,
            transaction_id=transaction_id,
            action=action,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
        logger.info(f"Audit: {action} by user {user_id}")
        
    except Exception as e:
        logger.error(f"Audit logging failed: {str(e)}")

def generate_transaction_number():
    """Generate unique transaction number"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = str(uuid.uuid4())[:6].upper()
    return f"TRX-{timestamp}-{random_suffix}"

def paginate_query(query, page=1, per_page=20, sort_by='created_at', sort_order='desc'):
    """Paginate SQLAlchemy query"""
    try:
        # Apply sorting
        if hasattr(query.column_descriptions[0]['type'], sort_by):
            sort_column = getattr(query.column_descriptions[0]['type'], sort_by)
            if sort_order.lower() == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        
        # Paginate
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return {
            'items': paginated.items,
            'pagination': {
                'page': paginated.page,
                'pages': paginated.pages,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }
        
    except Exception as e:
        logger.error(f"Pagination error: {str(e)}")
        return {
            'items': [],
            'pagination': {
                'page': 1,
                'pages': 0,
                'per_page': per_page,
                'total': 0,
                'has_next': False,
                'has_prev': False
            }
        }

def handle_validation_error(error):
    """Handle marshmallow validation errors"""
    return APIResponse.error(
        "Validation failed",
        error.messages,
        400
    )
