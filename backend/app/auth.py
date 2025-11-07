from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

bp = Blueprint('auth', __name__)

def validate_input(data, required_fields):
    if not data or not all(data.get(field) for field in required_fields):
        return False
    return True

def handle_error(error_msg, status_code=500):
    return jsonify({'error': error_msg}), status_code

@bp.route('/register', methods=['POST'])
def register():
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
        print(f"✅ User registered: {user.email} (ID: {user.id})")
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Register error: {str(e)}")
        return handle_error(str(e))

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"\n=== LOGIN START ===")
        print(f"Email: {data.get('email')}")
        
        if not validate_input(data, ['email', 'password']):
            return handle_error('Email and password required', 400)
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            print(f"❌ User not found")
            return handle_error('Invalid email or password', 401)
        
        if not check_password_hash(user.password, data['password']):
            print(f"❌ Wrong password")
            return handle_error('Invalid email or password', 401)
        
        # Create token WITHOUT expiry - never expires!
        token = create_access_token(identity=str(user.id))
        
        print(f"✅ Token created for user: {user.id}")
        print(f"✅ Token expires: NEVER (no expiry)")
        print(f"✅ LOGIN SUCCESS\n")
        
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
        print(f"❌ Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return handle_error(str(e))