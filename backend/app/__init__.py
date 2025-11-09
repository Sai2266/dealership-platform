from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()
jwt = JWTManager()

# Set Google Cloud credentials - absolute path
CREDENTIALS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'google-vision-key.json')
if os.path.exists(CREDENTIALS_PATH):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = CREDENTIALS_PATH
    print(f"✅ Google Cloud credentials loaded: {CREDENTIALS_PATH}")
else:
    print(f"⚠️ Warning: Credentials file not found at {CREDENTIALS_PATH}")

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Configuration
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///dealership.db'),
        SECRET_KEY=SECRET_KEY,
        JWT_SECRET_KEY=SECRET_KEY
    )
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.auth import bp as auth_bp
    from app.documents import bp as docs_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(docs_bp, url_prefix='/api/documents')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app