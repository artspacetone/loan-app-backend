from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import date

class LoginSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=6))

class UserSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=6))
    role = fields.Str(required=True, validate=validate.OneOf(['ADMIN', 'SUPERVISOR', 'USER']))
    company_logo = fields.Str(allow_none=True)
    is_active = fields.Bool(missing=True)

class BorrowerSchema(Schema):
    nik = fields.Str(required=True, validate=validate.Length(min=16, max=16))
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    department = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    phone = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    supervisor_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    supervisor_phone = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    is_blocked = fields.Bool(missing=False)

class ItemSchema(Schema):
    description = fields.Str(required=True, validate=validate.Length(min=5, max=500))
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    photo_url = fields.Str(allow_none=True)

class TransactionSchema(Schema):
    borrower_id = fields.Str(required=True)
    borrow_date = fields.Date(required=True)
    program_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    transaction_type = fields.Str(required=True, validate=validate.OneOf(['SHOW', 'EVENT', 'OFF_AIR', 'LAUNDRY']))
    item = fields.Nested(ItemSchema, required=True)
    additional_number = fields.Str(allow_none=True, validate=validate.Length(max=20))
    
    @validates_schema
    def validate_borrow_date(self, data, **kwargs):
        if data.get('borrow_date') and data['borrow_date'] < date.today():
            raise ValidationError('Borrow date cannot be in the past', 'borrow_date')

class ReturnDetailSchema(Schema):
    return_date = fields.Date(required=True)
    condition_notes = fields.Str(required=True, validate=validate.Length(min=5, max=500))
    returned_quantity = fields.Int(required=True, validate=validate.Range(min=1))
    marked_photo_url = fields.Str(allow_none=True)

class PaginationSchema(Schema):
    page = fields.Int(missing=1, validate=validate.Range(min=1))
    per_page = fields.Int(missing=20, validate=validate.Range(min=1, max=100))
    sort_by = fields.Str(missing='created_at')
    sort_order = fields.Str(missing='desc', validate=validate.OneOf(['asc', 'desc']))

# Schema instances
login_schema = LoginSchema()
user_schema = UserSchema()
users_schema = UserSchema(many=True)
borrower_schema = BorrowerSchema()
borrowers_schema = BorrowerSchema(many=True)
transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)
return_detail_schema = ReturnDetailSchema()
pagination_schema = PaginationSchema()
