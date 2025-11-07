from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

bp = Blueprint('auth', __name__)

def validate_input(data, required_fields):
    """Validate required fields in request data"""
    if not data or not all(data.get(field) for field in required_fields):
        return False
    return True

def handle_error(error_msg, status_code=500):
    """Standard error response"""
    return jsonify({'error': error_msg}), status_code

@bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        if not validate_input(data, ['email', 'password']):
            return handle_error('Email and password required', 400)
        
        if User.query.filter_by(email=data['email']).first():
            return handle_error('Email already exists', 400)
        
        user = User(
            email=data['email'],
            password=generate_password_hash(data['password']),
            role=data.get('role', 'dealer'),
            dealership_name=data.get('dealership_name', 'Unknown')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(str(e))

@bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.get_json()
        
        if not validate_input(data, ['email', 'password']):
            return handle_error('Email and password required', 400)
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return handle_error('Invalid email or password', 401)
        
        token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'dealership_name': user.dealership_name
            }
        }), 200
        
    except Exception as e:
        return handle_error(str(e))