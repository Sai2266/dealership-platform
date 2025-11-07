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
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'filename': self.filename, 'original_filename': self.original_filename,
            'file_type': self.file_type, 'status': self.status, 'uploaded_at': self.uploaded_at.isoformat()
        }