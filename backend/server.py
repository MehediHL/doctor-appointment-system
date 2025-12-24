from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
import random
import time
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Email configuration
SENDER_EMAIL = "mehedihasanlemon537@gmail.com"
SENDER_PASSWORD = "uwtv ekmt jdtw athu"  # Gmail App Password

# Store verification codes temporarily (in production, use Redis or database)
verification_codes = {}

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))

def send_verification_email(to_email, code):
    """Send verification email using Gmail SMTP"""
    try:
        msg = MIMEText(
            f"""Hello!

Thank you for registering with MediConnect.

Your email verification code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
MediConnect Team"""
        )
        msg["Subject"] = "MediConnect - Email Verification Code"
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

@app.route('/api/send-verification-code', methods=['POST'])
def send_verification_code():
    """Send verification code to user's email"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Generate verification code
        code = generate_verification_code()
        
        # Store code with timestamp (expires in 10 minutes)
        verification_codes[email] = {
            'code': code,
            'timestamp': datetime.now(),
            'expires_at': datetime.now() + timedelta(minutes=10)
        }
        
        # Send email
        if send_verification_email(email, code):
            return jsonify({
                'success': True,
                'message': 'Verification code sent to your email'
            }), 200
        else:
            return jsonify({
                'error': 'Failed to send verification email. Please try again.'
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    """Verify the code entered by user"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({'error': 'Email and code are required'}), 400
        
        # Check if code exists for this email
        if email not in verification_codes:
            return jsonify({
                'error': 'No verification code found. Please request a new code.'
            }), 400
        
        stored_data = verification_codes[email]
        
        # Check if code has expired
        if datetime.now() > stored_data['expires_at']:
            del verification_codes[email]
            return jsonify({
                'error': 'Verification code has expired. Please request a new code.'
            }), 400
        
        # Verify code
        if stored_data['code'] == code:
            # Code verified successfully
            del verification_codes[email]  # Remove used code
            return jsonify({
                'success': True,
                'message': 'Email verified successfully'
            }), 200
        else:
            return jsonify({
                'error': 'Invalid verification code. Please try again.'
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'MediConnect Email Verification API'}), 200

if __name__ == '__main__':
    print("Starting MediConnect Email Verification Server...")
    print(f"Server running on http://localhost:5001")
    app.run(debug=True, port=5001, host='0.0.0.0')

