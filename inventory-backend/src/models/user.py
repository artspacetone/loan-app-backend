from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, index=True)
    company_logo = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='admin_user', lazy=True, foreign_keys='Transaction.admin_id')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'companyLogo': self.company_logo,
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'lastLogin': self.last_login.isoformat() if self.last_login else None
        }
        if include_sensitive:
            data['updatedAt'] = self.updated_at.isoformat() if self.updated_at else None
        return data

class Borrower(db.Model):
    __tablename__ = 'borrowers'
    
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    nik = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    department = db.Column(db.String(50), nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    supervisor_name = db.Column(db.String(100), nullable=False)
    supervisor_phone = db.Column(db.String(20), nullable=False)
    is_blocked = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='borrower', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nik': self.nik,
            'name': self.name,
            'department': self.department,
            'phone': self.phone,
            'supervisorName': self.supervisor_name,
            'supervisorPhone': self.supervisor_phone,
            'isBlocked': self.is_blocked,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    additional_number = db.Column(db.String(20), nullable=True)
    borrow_date = db.Column(db.Date, nullable=False, index=True)
    program_name = db.Column(db.String(100), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False, index=True)
    deadline_date = db.Column(db.Date, nullable=False, index=True)
    item_description = db.Column(db.Text, nullable=False)
    item_quantity = db.Column(db.Integer, nullable=False)
    item_photo_url = db.Column(db.Text, nullable=True)
    
    # Foreign Keys
    borrower_id = db.Column(db.String(50), db.ForeignKey('borrowers.id'), nullable=False, index=True)
    admin_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Status and approval
    status = db.Column(db.String(20), nullable=False, index=True)
    borrower_approved = db.Column(db.Boolean, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    return_details = db.relationship('ReturnDetail', backref='transaction', lazy=True, cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='transaction', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'transactionNumber': self.transaction_number,
            'additionalNumber': self.additional_number,
            'borrowDate': self.borrow_date.isoformat() if self.borrow_date else None,
            'programName': self.program_name,
            'transactionType': self.transaction_type,
            'deadlineDate': self.deadline_date.isoformat() if self.deadline_date else None,
            'item': {
                'description': self.item_description,
                'quantity': self.item_quantity,
                'photoUrl': self.item_photo_url
            },
            'borrowerId': self.borrower_id,
            'borrowerSnapshot': self.borrower.to_dict() if self.borrower else {},
            'status': self.status,
            'adminId': self.admin_id,
            'adminUsername': self.admin_user.username if self.admin_user else None,
            'borrowerApproved': self.borrower_approved,
            'returnDetails': [rd.to_dict() for rd in self.return_details],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

class ReturnDetail(db.Model):
    __tablename__ = 'return_details'
    
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(50), db.ForeignKey('transactions.id'), nullable=False, index=True)
    return_date = db.Column(db.Date, nullable=False)
    marked_photo_url = db.Column(db.Text, nullable=True)
    condition_notes = db.Column(db.Text, nullable=False)
    returned_quantity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, index=True)
    borrower_approved = db.Column(db.Boolean, nullable=True)
    admin_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'returnDate': self.return_date.isoformat() if self.return_date else None,
            'markedPhotoUrl': self.marked_photo_url,
            'conditionNotes': self.condition_notes,
            'returnedQuantity': self.returned_quantity,
            'status': self.status,
            'borrowerApproved': self.borrower_approved,
            'adminId': self.admin_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    transaction_id = db.Column(db.String(50), db.ForeignKey('transactions.id'), nullable=True, index=True)
    action = db.Column(db.String(50), nullable=False, index=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'transactionId': self.transaction_id,
            'action': self.action,
            'details': self.details,
            'ipAddress': self.ip_address,
            'userAgent': self.user_agent,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
