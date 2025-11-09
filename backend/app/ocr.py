from google.cloud import vision
import re
from datetime import datetime

client = vision.ImageAnnotatorClient()

VIN_PATTERN = r'\b[A-HJ-NPR-Z0-9]{17}\b'

DOCUMENT_TYPES = {
    'title': ['certificate of title', 'vehicle title', 'title certificate'],
    'registration': ['vehicle registration', 'registration certificate', 'plate registration'],
    'buyer_order': ['buyer order', 'purchase order', 'buyers order', "buyer's order"],
    'deal': ['deal', 'dealer packet'],
    'contract': ['purchase contract', 'sales contract', 'contract agreement'],
    'odometer_statement': ['odometer', 'mileage disclosure', 'odometer statement'],
    'invoice': ['invoice', 'bill of sale', 'receipt'],
}

def convert_pdf_to_image(pdf_path):
    """Convert PDF to JPEG image using PyMuPDF"""
    try:
        import fitz
        
        pdf_document = fitz.open(pdf_path)
        first_page = pdf_document[0]
        pix = first_page.get_pixmap(matrix=fitz.Matrix(2, 2))
        image_bytes = pix.tobytes("jpeg")
        pdf_document.close()
        
        return image_bytes, None
        
    except ImportError:
        return None, "PyMuPDF not installed. Install with: pip install PyMuPDF"
    except Exception as e:
        return None, str(e)

def extract_text_from_image(image_path):
    """Extract text from image or PDF using Google Vision API"""
    try:
        if image_path.lower().endswith('.pdf'):
            content, error = convert_pdf_to_image(image_path)
            if error:
                return None, error
        else:
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
        
        image = vision.Image(content=content)
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            return None, response.error.message
        
        return response.full_text_annotation.text, None
        
    except Exception as e:
        return None, str(e)

def extract_vin(text):
    """Extract VIN (17-character code)"""
    matches = re.findall(VIN_PATTERN, text, re.IGNORECASE)
    if matches:
        return matches[0].upper()
    return None

def extract_buyer_name(text):
    """Extract buyer name from 'Sold To:' field"""
    patterns = [
        r'Sold\s+To[:\s]+([^\n]+?)(?:\nEmail|City|Address|$)',
        r'Sold\s+To[:\s]+([A-Za-z\s]+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            name = match.group(1).strip()
            if name and len(name) > 2 and len(name) < 100:
                name = re.sub(r'[^\w\s]', '', name).strip()
                if name and name.upper() not in ['INFORMATION', 'DETAILS', 'CUSTOMER']:
                    return name
    return None

def extract_seller_name(text):
    """Extract seller/dealer name from 'We Own:' field"""
    patterns = [
        r'We\s+Own[:\s]+([^\n]+?)(?:\n|Dealer|Address|$)',
        r'We\s+Own[:\s]+([A-Za-z\s]+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            name = match.group(1).strip()
            if name and len(name) > 2 and len(name) < 100:
                name = re.sub(r'[^\w\s]', '', name).strip()
                if name and name.upper() not in ['INFORMATION', 'DETAILS', 'DEAL']:
                    return name
    return None

def extract_date(text):
    """Extract purchase date"""
    patterns = [
        r'Purchase\s+Date[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None

def extract_amount(text):
    """Extract only the amount with $ sign"""
    pattern = r'\$\s*([\d,]+\.?\d*)'
    match = re.search(pattern, text)
    if match:
        return match.group(0).strip()
    return None

def extract_odometer(text):
    """Extract odometer reading with 'miles' suffix"""
    patterns = [
        r'Odometer\s+Reading[:\s]+([0-9,]+)\s*(?:miles|mi)?',
        r'(?:Odometer|Mileage)[:\s]+([0-9,]+)\s*(?:miles|mi)?',
        r'([0-9,]+)\s+miles',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            odometer = match.group(1).replace(',', '').strip()
            if len(odometer) > 2 and len(odometer) < 8:
                return f"{odometer} miles"
    return None

def identify_document_type(text):
    """Identify type of document"""
    text_lower = text.lower()
    for doc_type, keywords in DOCUMENT_TYPES.items():
        for keyword in keywords:
            if keyword in text_lower:
                return doc_type
    return 'unknown'

def parse_vehicle_data(text):
    """Parse extracted text to find vehicle-related data"""
    try:
        return {
            'vin': extract_vin(text),
            'buyer_name': extract_buyer_name(text),
            'seller_name': extract_seller_name(text),
            'sale_date': extract_date(text),
            'sale_amount': extract_amount(text),
            'odometer_reading': extract_odometer(text),
            'document_type': identify_document_type(text)
        }
    except Exception as e:
        return {}

def process_document(file_path):
    """Main function to process a document"""
    extracted_text, error = extract_text_from_image(file_path)
    
    if error:
        return {
            'success': False,
            'error': error,
            'extracted_text': None,
            'extracted_data': None
        }
    
    extracted_data = parse_vehicle_data(extracted_text)
    
    return {
        'success': True,
        'error': None,
        'extracted_text': extracted_text,
        'extracted_data': extracted_data,
        'processed_at': datetime.utcnow().isoformat()
    }