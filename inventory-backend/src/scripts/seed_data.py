#!/usr/bin/env python3
"""
Seed script to populate database with initial data
Run this script to add sample users, borrowers, and transactions
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.main import create_app
from src.models.user import db, User, Borrower, Transaction, ReturnDetail
from datetime import datetime, date, timedelta
import uuid

def seed_users():
    """Create sample users"""
    users_data = [
        {'username': 'admin', 'password': 'admin123', 'role': 'ADMIN'},
        {'username': 'supervisor1', 'password': 'super123', 'role': 'SUPERVISOR'},
        {'username': 'user1', 'password': 'user123', 'role': 'USER'},
        {'username': 'user2', 'password': 'user123', 'role': 'USER'},
    ]
    
    for user_data in users_data:
        existing_user = User.query.filter_by(username=user_data['username']).first()
        if not existing_user:
            user = User(
                username=user_data['username'],
                role=user_data['role']
            )
            user.set_password(user_data['password'])
            db.session.add(user)
            print(f"Created user: {user_data['username']}")
    
    db.session.commit()

def seed_borrowers():
    """Create sample borrowers"""
    borrowers_data = [
        {
            'nik': '1234567890123456',
            'name': 'John Doe',
            'department': 'IT Department',
            'phone': '081234567890',
            'supervisor_name': 'Jane Smith',
            'supervisor_phone': '081234567891'
        },
        {
            'nik': '2345678901234567',
            'name': 'Alice Johnson',
            'department': 'Marketing',
            'phone': '081234567892',
            'supervisor_name': 'Bob Wilson',
            'supervisor_phone': '081234567893'
        },
        {
            'nik': '3456789012345678',
            'name': 'Mike Brown',
            'department': 'Production',
            'phone': '081234567894',
            'supervisor_name': 'Sarah Davis',
            'supervisor_phone': '081234567895'
        },
        {
            'nik': '4567890123456789',
            'name': 'Emma Wilson',
            'department': 'HR',
            'phone': '081234567896',
            'supervisor_name': 'Tom Anderson',
            'supervisor_phone': '081234567897'
        }
    ]
    
    for borrower_data in borrowers_data:
        existing_borrower = Borrower.query.filter_by(nik=borrower_data['nik']).first()
        if not existing_borrower:
            borrower = Borrower(**borrower_data)
            db.session.add(borrower)
            print(f"Created borrower: {borrower_data['name']}")
    
    db.session.commit()

def seed_transactions():
    """Create sample transactions"""
    admin_user = User.query.filter_by(username='admin').first()
    user1 = User.query.filter_by(username='user1').first()
    borrowers = Borrower.query.all()
    
    if not admin_user or not user1 or not borrowers:
        print("Required users or borrowers not found. Please run seed_users and seed_borrowers first.")
        return
    
    transactions_data = [
        {
            'program_name': 'Morning Show',
            'transaction_type': 'SHOW',
            'item_description': 'Professional Camera Sony FX6',
            'item_quantity': 1,
            'borrow_date': date.today() - timedelta(days=5),
            'status': 'NVL',
            'admin_id': admin_user.id,
            'borrower_id': borrowers[0].id
        },
        {
            'program_name': 'Corporate Event 2024',
            'transaction_type': 'EVENT',
            'item_description': 'Wireless Microphone Set (4 units)',
            'item_quantity': 4,
            'borrow_date': date.today() - timedelta(days=3),
            'status': 'PENDING_APPROVAL',
            'admin_id': user1.id,
            'borrower_id': borrowers[1].id
        },
        {
            'program_name': 'Documentary Filming',
            'transaction_type': 'OFF_AIR',
            'item_description': 'Lighting Kit with Stands',
            'item_quantity': 1,
            'borrow_date': date.today() - timedelta(days=10),
            'status': 'AVL',
            'admin_id': admin_user.id,
            'borrower_id': borrowers[2].id
        },
        {
            'program_name': 'Studio Maintenance',
            'transaction_type': 'LAUNDRY',
            'item_description': 'Studio Backdrop Cloths',
            'item_quantity': 3,
            'borrow_date': date.today() - timedelta(days=1),
            'status': 'PENDING_APPROVAL',
            'admin_id': user1.id,
            'borrower_id': borrowers[3].id
        }
    ]
    
    for trans_data in transactions_data:
        # Generate unique transaction number
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_suffix = str(uuid.uuid4())[:6].upper()
        transaction_number = f"TRX-{timestamp}-{random_suffix}"
        
        # Calculate deadline
        deadline_date = trans_data['borrow_date'] + timedelta(days=14)
        
        transaction = Transaction(
            transaction_number=transaction_number,
            program_name=trans_data['program_name'],
            transaction_type=trans_data['transaction_type'],
            item_description=trans_data['item_description'],
            item_quantity=trans_data['item_quantity'],
            borrow_date=trans_data['borrow_date'],
            deadline_date=deadline_date,
            status=trans_data['status'],
            admin_id=trans_data['admin_id'],
            borrower_id=trans_data['borrower_id']
        )
        
        db.session.add(transaction)
        print(f"Created transaction: {transaction_number}")
    
    db.session.commit()

def seed_return_details():
    """Create sample return details"""
    transactions = Transaction.query.filter(Transaction.status.in_(['AVL', 'NVL'])).all()
    admin_user = User.query.filter_by(username='admin').first()
    
    if not transactions or not admin_user:
        print("No suitable transactions found for return details")
        return
    
    for transaction in transactions[:2]:  # Add returns for first 2 transactions
        return_detail = ReturnDetail(
            transaction_id=transaction.id,
            return_date=date.today() - timedelta(days=2),
            condition_notes='Item returned in good condition',
            returned_quantity=transaction.item_quantity,
            status='COMPLETE' if transaction.status == 'AVL' else 'INCOMPLETE',
            borrower_approved=True if transaction.status == 'AVL' else False,
            admin_id=admin_user.id
        )
        
        db.session.add(return_detail)
        print(f"Created return detail for transaction: {transaction.transaction_number}")
    
    db.session.commit()

def main():
    """Main seeding function"""
    app = create_app('development')
    
    with app.app_context():
        print("Starting database seeding...")
        
        # Create tables if they don't exist
        db.create_all()
        
        # Seed data
        print("\n1. Seeding users...")
        seed_users()
        
        print("\n2. Seeding borrowers...")
        seed_borrowers()
        
        print("\n3. Seeding transactions...")
        seed_transactions()
        
        print("\n4. Seeding return details...")
        seed_return_details()
        
        print("\nDatabase seeding completed successfully!")
        print("\nDefault login credentials:")
        print("Admin: admin / admin123")
        print("Supervisor: supervisor1 / super123")
        print("User: user1 / user123")

if __name__ == '__main__':
    main()
