from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import Document
from app.ocr import process_document
import os
from datetime import datetime

bp = Blueprint('documents', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_TYPES = {'pdf', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 100 * 1024 * 1024

def verify_auth():
    """Verify JWT and return user_id"""
    try:
        verify_jwt_in_request()
        return int(get_jwt_identity()), None
    except Exception:
        return None, (jsonify({'error': 'Unauthorized'}), 401)

def handle_options():
    """Handle CORS preflight"""
    return '', 200

def get_user_folder(user_id):
    """Create user upload folder"""
    folder = os.path.join(UPLOAD_FOLDER, f'user_{user_id}')
    os.makedirs(folder, exist_ok=True)
    return folder

def validate_file(file):
    """Validate file (is_valid, error, ext, size)"""
    if not file.filename or '.' not in file.filename:
        return False, 'Invalid filename', None, None
    
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_TYPES:
        return False, 'Invalid type', None, None
    
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, 'File too large', None, None
    
    return True, None, ext, size

def check_authorization(doc, user_id):
    """Check document ownership"""
    if not doc or doc.uploaded_by != user_id:
        return False, 'Unauthorized', 403
    return True, None, 200

def check_file_exists(file_path):
    """Check if file exists"""
    if not os.path.exists(file_path):
        return False, 'File not found', 404
    return True, None, 200

def process_ocr(doc, filepath):
    """Process document with OCR"""
    try:
        ocr_result = process_document(filepath)
        
        if ocr_result['success']:
            doc.status = 'completed'
            doc.extracted_text = ocr_result['extracted_text']
            doc.vin = ocr_result['extracted_data'].get('vin')
            doc.buyer_name = ocr_result['extracted_data'].get('buyer_name')
            doc.seller_name = ocr_result['extracted_data'].get('seller_name')
            doc.sale_date = ocr_result['extracted_data'].get('sale_date')
            doc.sale_amount = ocr_result['extracted_data'].get('sale_amount')
            doc.odometer_reading = ocr_result['extracted_data'].get('odometer_reading')
            doc.document_type = ocr_result['extracted_data'].get('document_type')
        else:
            doc.status = 'failed'
        
        db.session.commit()
    except Exception as e:
        doc.status = 'failed'
        db.session.commit()

@bp.route('/upload', methods=['POST', 'OPTIONS'])
def upload():
    """Upload documents"""
    if request.method == 'OPTIONS':
        return handle_options()
    
    user_id, auth_error = verify_auth()
    if auth_error:
        return auth_error
    
    try:
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({'error': 'No files'}), 400
        
        user_folder = get_user_folder(user_id)
        uploaded = []
        errors = []
        
        for file in files:
            is_valid, error, ext, size = validate_file(file)
            if not is_valid:
                errors.append(error)
                continue
            
            try:
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{file.filename}"
                filepath = os.path.join(user_folder, filename)
                file.save(filepath)
                
                doc = Document(
                    uploaded_by=user_id,
                    filename=filename,
                    original_filename=file.filename,
                    file_type=ext,
                    file_size=size,
                    file_path=filepath,
                    status='pending'
                )
                db.session.add(doc)
                db.session.commit()
                
                process_ocr(doc, filepath)
                
                uploaded.append({
                    'filename': file.filename,
                    'size': size,
                    'id': doc.id
                })
                
            except Exception as e:
                errors.append(str(e))
        
        status_code = 200 if uploaded else 400
        return jsonify({
            'success': bool(uploaded),
            'message': f'Uploaded {len(uploaded)} file(s)',
            'uploaded': uploaded,
            'errors': errors if errors else None
        }), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['GET', 'OPTIONS'])
@bp.route('', methods=['GET', 'OPTIONS'])
def list_documents():
    """Get all documents"""
    if request.method == 'OPTIONS':
        return handle_options()
    
    user_id, auth_error = verify_auth()
    if auth_error:
        return auth_error
    
    try:
        docs = Document.query.filter_by(uploaded_by=user_id).all()
        return jsonify({
            'success': True,
            'documents': [doc.to_dict() for doc in docs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:doc_id>/download', methods=['GET', 'OPTIONS'])
def download(doc_id):
    """Download document"""
    if request.method == 'OPTIONS':
        return handle_options()
    
    user_id, auth_error = verify_auth()
    if auth_error:
        return auth_error
    
    try:
        doc = Document.query.get(doc_id)
        
        authorized, error, code = check_authorization(doc, user_id)
        if not authorized:
            return jsonify({'error': error}), code
        
        exists, error, code = check_file_exists(doc.file_path)
        if not exists:
            return jsonify({'error': error}), code
        
        return send_file(
            doc.file_path,
            as_attachment=True,
            download_name=doc.original_filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:doc_id>', methods=['DELETE', 'OPTIONS'])
def delete(doc_id):
    """Delete document"""
    if request.method == 'OPTIONS':
        return handle_options()
    
    user_id, auth_error = verify_auth()
    if auth_error:
        return auth_error
    
    try:
        doc = Document.query.get(doc_id)
        
        authorized, error, code = check_authorization(doc, user_id)
        if not authorized:
            return jsonify({'error': error}), code
        
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        
        db.session.delete(doc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Deleted'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:doc_id>/notes', methods=['GET', 'POST', 'OPTIONS'])
def manage_notes(doc_id):
    """Get or update document notes"""
    if request.method == 'OPTIONS':
        return handle_options()
    
    user_id, auth_error = verify_auth()
    if auth_error:
        return auth_error
    
    try:
        doc = Document.query.get(doc_id)
        
        if not doc or doc.uploaded_by != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'id': doc.id,
                'filename': doc.original_filename,
                'file_type': doc.file_type,
                'notes': doc.notes or '',
                'vin': doc.vin,
                'buyer_name': doc.buyer_name,
                'seller_name': doc.seller_name,
                'sale_date': doc.sale_date,
                'sale_amount': doc.sale_amount,
                'odometer_reading': doc.odometer_reading,
                'document_type': doc.document_type,
                'status': doc.status
            }), 200
        
        data = request.get_json()
        doc.notes = data.get('notes', '')
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Notes saved'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500