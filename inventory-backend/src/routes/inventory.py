from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from datetime import datetime, timedelta
from src.models.user import db, User, Borrower, Transaction, ReturnDetail
from src.schemas.validation import (
    borrower_schema, borrowers_schema, transaction_schema, transactions_schema,
    return_detail_schema, pagination_schema
)
from src.utils.helpers import (
    APIResponse, require_role, log_audit, paginate_query, 
    generate_transaction_number, logger
)

inventory_bp = Blueprint('inventory', __name__)

# Transaction endpoints
@inventory_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get paginated list of transactions with filters"""
    try:
        # Validate pagination parameters
        pagination_data = pagination_schema.load(request.args)
        
        # Build query
        query = Transaction.query
        
        # Apply filters
        if request.args.get('status'):
            query = query.filter(Transaction.status == request.args.get('status'))
        
        if request.args.get('transaction_type'):
            query = query.filter(Transaction.transaction_type == request.args.get('transaction_type'))
        
        if request.args.get('borrower_id'):
            query = query.filter(Transaction.borrower_id == request.args.get('borrower_id'))
        
        if request.args.get('search'):
            search_term = f"%{request.args.get('search')}%"
            query = query.filter(
                db.or_(
                    Transaction.transaction_number.ilike(search_term),
                    Transaction.program_name.ilike(search_term),
                    Transaction.item_description.ilike(search_term)
                )
            )
        
        # Date range filters
        if request.args.get('date_from'):
            date_from = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d').date()
            query = query.filter(Transaction.borrow_date >= date_from)
        
        if request.args.get('date_to'):
            date_to = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d').date()
            query = query.filter(Transaction.borrow_date <= date_to)
        
        # Paginate
        result = paginate_query(
            query,
            pagination_data['page'],
            pagination_data['per_page'],
            pagination_data['sort_by'],
            pagination_data['sort_order']
        )
        
        # Serialize transactions
        transactions_data = [t.to_dict() for t in result['items']]
        
        log_audit('VIEW_TRANSACTIONS', f"Viewed transactions list - page {pagination_data['page']}")
        
        return APIResponse.paginated(transactions_data, result['pagination'])
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Get transactions error: {str(e)}")
        return APIResponse.error('Failed to retrieve transactions', status_code=500)

@inventory_bp.route('/transactions/<transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """Get specific transaction by ID"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return APIResponse.error('Transaction not found', status_code=404)
        
        log_audit('VIEW_TRANSACTION', f"Viewed transaction: {transaction.transaction_number}", transaction_id)
        
        return APIResponse.success(transaction.to_dict())
        
    except Exception as e:
        logger.error(f"Get transaction error: {str(e)}")
        return APIResponse.error('Failed to retrieve transaction', status_code=500)

@inventory_bp.route('/transactions', methods=['POST'])
@jwt_required()
@require_role(['ADMIN', 'USER'])
def create_transaction():
    """Create new transaction"""
    try:
        # Validate input
        data = transaction_schema.load(request.get_json() or {})
        
        # Verify borrower exists
        borrower = Borrower.query.get(data['borrower_id'])
        if not borrower:
            return APIResponse.error('Borrower not found', status_code=404)
        
        if borrower.is_blocked:
            return APIResponse.error('Borrower is blocked', status_code=400)
        
        # Calculate deadline (14 days from borrow date)
        deadline_date = data['borrow_date'] + timedelta(days=14)
        
        # Create transaction
        transaction = Transaction(
            transaction_number=generate_transaction_number(),
            additional_number=data.get('additional_number'),
            borrow_date=data['borrow_date'],
            program_name=data['program_name'],
            transaction_type=data['transaction_type'],
            deadline_date=deadline_date,
            item_description=data['item']['description'],
            item_quantity=data['item']['quantity'],
            item_photo_url=data['item'].get('photo_url'),
            borrower_id=data['borrower_id'],
            admin_id=get_jwt_identity(),
            status='PENDING_APPROVAL'
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        log_audit('CREATE_TRANSACTION', f"Created transaction: {transaction.transaction_number}", transaction.id)
        
        return APIResponse.success(
            transaction.to_dict(),
            "Transaction created successfully",
            201
        )
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Create transaction error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to create transaction', status_code=500)

@inventory_bp.route('/transactions/<transaction_id>', methods=['PATCH'])
@jwt_required()
@require_role(['ADMIN', 'SUPERVISOR'])
def update_transaction(transaction_id):
    """Update transaction"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return APIResponse.error('Transaction not found', status_code=404)
        
        data = request.get_json() or {}
        
        # Update allowed fields
        if 'status' in data:
            if data['status'] not in ['PENDING_APPROVAL', 'NVL', 'AVL']:
                return APIResponse.error('Invalid status', status_code=400)
            transaction.status = data['status']
        
        if 'borrower_approved' in data:
            transaction.borrower_approved = data['borrower_approved']
        
        if 'additional_number' in data:
            transaction.additional_number = data['additional_number']
        
        db.session.commit()
        
        log_audit('UPDATE_TRANSACTION', f"Updated transaction: {transaction.transaction_number}", transaction_id)
        
        return APIResponse.success(
            transaction.to_dict(),
            "Transaction updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Update transaction error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to update transaction', status_code=500)

# Borrower endpoints
@inventory_bp.route('/borrowers', methods=['GET'])
@jwt_required()
def get_borrowers():
    """Get paginated list of borrowers"""
    try:
        # Check for NIK filter (for existing borrower lookup)
        nik = request.args.get('nik')
        if nik:
            borrowers = Borrower.query.filter_by(nik=nik).all()
            return APIResponse.success([b.to_dict() for b in borrowers])
        
        # Validate pagination parameters
        pagination_data = pagination_schema.load(request.args)
        
        # Build query
        query = Borrower.query
        
        # Apply filters
        if request.args.get('department'):
            query = query.filter(Borrower.department == request.args.get('department'))
        
        if request.args.get('is_blocked') is not None:
            is_blocked = request.args.get('is_blocked').lower() == 'true'
            query = query.filter(Borrower.is_blocked == is_blocked)
        
        if request.args.get('search'):
            search_term = f"%{request.args.get('search')}%"
            query = query.filter(
                db.or_(
                    Borrower.name.ilike(search_term),
                    Borrower.nik.ilike(search_term),
                    Borrower.department.ilike(search_term)
                )
            )
        
        # Paginate
        result = paginate_query(
            query,
            pagination_data['page'],
            pagination_data['per_page'],
            pagination_data['sort_by'],
            pagination_data['sort_order']
        )
        
        # Serialize borrowers
        borrowers_data = [b.to_dict() for b in result['items']]
        
        log_audit('VIEW_BORROWERS', f"Viewed borrowers list - page {pagination_data['page']}")
        
        return APIResponse.paginated(borrowers_data, result['pagination'])
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Get borrowers error: {str(e)}")
        return APIResponse.error('Failed to retrieve borrowers', status_code=500)

@inventory_bp.route('/borrowers', methods=['POST'])
@jwt_required()
@require_role(['ADMIN', 'USER'])
def create_borrower():
    """Create new borrower or update existing one"""
    try:
        # Validate input
        data = borrower_schema.load(request.get_json() or {})
        
        # Check if borrower with NIK already exists
        existing_borrower = Borrower.query.filter_by(nik=data['nik']).first()
        if existing_borrower:
            # Update existing borrower
            existing_borrower.name = data['name']
            existing_borrower.department = data['department']
            existing_borrower.phone = data['phone']
            existing_borrower.supervisor_name = data['supervisor_name']
            existing_borrower.supervisor_phone = data['supervisor_phone']
            
            db.session.commit()
            
            log_audit('UPDATE_BORROWER', f"Updated borrower: {existing_borrower.name}")
            
            return APIResponse.success(
                existing_borrower.to_dict(),
                "Borrower updated successfully"
            )
        
        # Create new borrower
        borrower = Borrower(
            nik=data['nik'],
            name=data['name'],
            department=data['department'],
            phone=data['phone'],
            supervisor_name=data['supervisor_name'],
            supervisor_phone=data['supervisor_phone'],
            is_blocked=data.get('is_blocked', False)
        )
        
        db.session.add(borrower)
        db.session.commit()
        
        log_audit('CREATE_BORROWER', f"Created borrower: {borrower.name}")
        
        return APIResponse.success(
            borrower.to_dict(),
            "Borrower created successfully",
            201
        )
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Create borrower error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to create borrower', status_code=500)

@inventory_bp.route('/borrowers/<borrower_id>', methods=['PATCH'])
@jwt_required()
@require_role(['ADMIN', 'SUPERVISOR'])
def update_borrower(borrower_id):
    """Update borrower"""
    try:
        borrower = Borrower.query.get(borrower_id)
        if not borrower:
            return APIResponse.error('Borrower not found', status_code=404)
        
        data = request.get_json() or {}
        
        # Update fields
        if 'name' in data:
            borrower.name = data['name']
        if 'department' in data:
            borrower.department = data['department']
        if 'phone' in data:
            borrower.phone = data['phone']
        if 'supervisor_name' in data:
            borrower.supervisor_name = data['supervisor_name']
        if 'supervisor_phone' in data:
            borrower.supervisor_phone = data['supervisor_phone']
        if 'is_blocked' in data:
            borrower.is_blocked = data['is_blocked']
        
        db.session.commit()
        
        log_audit('UPDATE_BORROWER', f"Updated borrower: {borrower.name}")
        
        return APIResponse.success(
            borrower.to_dict(),
            "Borrower updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Update borrower error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to update borrower', status_code=500)

# Return detail endpoints
@inventory_bp.route('/transactions/<transaction_id>/returns', methods=['POST'])
@jwt_required()
@require_role(['ADMIN', 'USER'])
def add_return_detail(transaction_id):
    """Add return detail to transaction"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return APIResponse.error('Transaction not found', status_code=404)
        
        # Validate input
        data = return_detail_schema.load(request.get_json() or {})
        
        # Check if return quantity is valid
        total_returned = sum(rd.returned_quantity for rd in transaction.return_details)
        if total_returned + data['returned_quantity'] > transaction.item_quantity:
            return APIResponse.error('Return quantity exceeds borrowed quantity', status_code=400)
        
        # Create return detail
        return_detail = ReturnDetail(
            transaction_id=transaction_id,
            return_date=data['return_date'],
            marked_photo_url=data.get('marked_photo_url'),
            condition_notes=data['condition_notes'],
            returned_quantity=data['returned_quantity'],
            status='PENDING_RETURN_APPROVAL',
            admin_id=get_jwt_identity()
        )
        
        db.session.add(return_detail)
        db.session.commit()
        
        log_audit('ADD_RETURN', f"Added return detail to transaction: {transaction.transaction_number}", transaction_id)
        
        return APIResponse.success(
            return_detail.to_dict(),
            "Return detail added successfully",
            201
        )
        
    except ValidationError as e:
        return APIResponse.error('Validation failed', e.messages, 400)
    except Exception as e:
        logger.error(f"Add return detail error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to add return detail', status_code=500)

@inventory_bp.route('/returns/<return_id>/approve', methods=['PATCH'])
@jwt_required()
@require_role(['ADMIN', 'SUPERVISOR'])
def approve_return(return_id):
    """Approve or reject return detail"""
    try:
        return_detail = ReturnDetail.query.get(return_id)
        if not return_detail:
            return APIResponse.error('Return detail not found', status_code=404)
        
        data = request.get_json() or {}
        approved = data.get('approved', False)
        
        # Update return detail
        return_detail.borrower_approved = approved
        return_detail.status = 'COMPLETE' if approved else 'INCOMPLETE'
        
        # Update transaction status if needed
        transaction = return_detail.transaction
        if approved:
            total_returned_approved = sum(
                rd.returned_quantity for rd in transaction.return_details 
                if rd.borrower_approved
            )
            
            if total_returned_approved >= transaction.item_quantity:
                transaction.status = 'AVL'
            else:
                transaction.status = 'NVL'
        
        db.session.commit()
        
        action = 'APPROVE_RETURN' if approved else 'REJECT_RETURN'
        log_audit(action, f"Return approval for transaction: {transaction.transaction_number}", transaction.id)
        
        return APIResponse.success(
            return_detail.to_dict(),
            f"Return {'approved' if approved else 'rejected'} successfully"
        )
        
    except Exception as e:
        logger.error(f"Approve return error: {str(e)}")
        db.session.rollback()
        return APIResponse.error('Failed to process return approval', status_code=500)

# Dashboard/Statistics endpoints
@inventory_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Get basic counts
        total_transactions = Transaction.query.count()
        pending_approvals = Transaction.query.filter_by(status='PENDING_APPROVAL').count()
        overdue_transactions = Transaction.query.filter(
            Transaction.deadline_date < datetime.now().date(),
            Transaction.status.in_(['NVL', 'PENDING_APPROVAL'])
        ).count()
        total_borrowers = Borrower.query.count()
        blocked_borrowers = Borrower.query.filter_by(is_blocked=True).count()
        
        # Get recent transactions
        recent_transactions = Transaction.query.order_by(
            Transaction.created_at.desc()
        ).limit(5).all()
        
        stats = {
            'totalTransactions': total_transactions,
            'pendingApprovals': pending_approvals,
            'overdueTransactions': overdue_transactions,
            'totalBorrowers': total_borrowers,
            'blockedBorrowers': blocked_borrowers,
            'recentTransactions': [t.to_dict() for t in recent_transactions]
        }
        
        log_audit('VIEW_DASHBOARD', "Viewed dashboard statistics")
        
        return APIResponse.success(stats)
        
    except Exception as e:
        logger.error(f"Get dashboard stats error: {str(e)}")
        return APIResponse.error('Failed to retrieve dashboard statistics', status_code=500)
