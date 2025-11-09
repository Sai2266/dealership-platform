from app import db
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='dealer')
    dealership_name = db.Column(db.String(100))

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    filename = db.Column(db.String(255))
    original_filename = db.Column(db.String(255))
    file_type = db.Column(db.String(10))
    file_size = db.Column(db.Integer)
    file_path = db.Column(db.String(500))
    status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    extracted_text = db.Column(db.Text)
    vin = db.Column(db.String(100))
    buyer_name = db.Column(db.String(255))
    seller_name = db.Column(db.String(255))
    sale_date = db.Column(db.String(50))
    sale_amount = db.Column(db.String(50))
    odometer_reading = db.Column(db.String(50))
    document_type = db.Column(db.String(100))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_type': self.file_type,
            'status': self.status,
            'notes': self.notes,
            'vin': self.vin,
            'buyer_name': self.buyer_name,
            'seller_name': self.seller_name,
            'sale_date': self.sale_date,
            'sale_amount': self.sale_amount,
            'odometer_reading': self.odometer_reading,
            'document_type': self.document_type,
            'uploaded_at': self.uploaded_at.isoformat()
        }