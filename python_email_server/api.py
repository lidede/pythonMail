from flask import Flask, request, jsonify
from pydantic import ValidationError
import logging

from .storage import storage
from .models import CreateAccountRequest, CreateEmailRequest, EmailMessageWithMagicLinks
from .email_parser import extract_magic_links

app = Flask(__name__)
logger = logging.getLogger(__name__)

def init_routes(app):
    """Initialize API routes."""
    
    @app.route('/api/accounts', methods=['GET'])
    def get_accounts():
        """Get all email accounts with unread counts."""
        try:
            accounts = storage.get_email_accounts()
            result = []
            
            for account in accounts:
                account_dict = account.model_dump()
                account_dict["unread_count"] = storage.get_unread_count(account.id)
                # Don't send the password back to the client
                account_dict.pop("password", None)
                result.append(account_dict)
                
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error fetching accounts: {e}")
            return jsonify({"error": "Failed to fetch email accounts"}), 500

    @app.route('/api/accounts/<int:account_id>', methods=['GET'])
    def get_account(account_id):
        """Get a specific email account."""
        try:
            account = storage.get_email_account(account_id)
            if not account:
                return jsonify({"error": "Account not found"}), 404
                
            account_dict = account.model_dump()
            account_dict["unread_count"] = storage.get_unread_count(account.id)
            # Don't send the password back to the client
            account_dict.pop("password", None)
            
            return jsonify(account_dict)
        except Exception as e:
            logger.error(f"Error fetching account {account_id}: {e}")
            return jsonify({"error": "Failed to fetch email account"}), 500

    @app.route('/api/accounts', methods=['POST'])
    def create_account():
        """Create a new email account."""
        try:
            data = request.json
            create_request = CreateAccountRequest(**data)
            
            # Check if email already exists
            email = f"{create_request.username}@{create_request.domain}"
            existing_account = storage.get_email_account_by_email(email)
            
            if existing_account:
                return jsonify({"error": "Email address already exists"}), 409
                
            account_data = {
                "username": create_request.username,
                "domain": create_request.domain,
                "email": email,
                "password": create_request.password
            }
            account = storage.create_email_account(account_data)
            
            account_dict = account.model_dump()
            account_dict["unread_count"] = 0
            # Don't send the password back to the client
            account_dict.pop("password", None)
            
            return jsonify(account_dict), 201
        except ValidationError as e:
            return jsonify({"error": "Validation error", "details": str(e)}), 400
        except Exception as e:
            logger.error(f"Error creating account: {e}")
            return jsonify({"error": "Failed to create email account"}), 500

    @app.route('/api/accounts/<int:account_id>/emails', methods=['GET'])
    def get_emails(account_id):
        """Get all emails for an account."""
        try:
            account = storage.get_email_account(account_id)
            if not account:
                return jsonify({"error": "Account not found"}), 404
                
            emails = storage.get_email_messages(account_id)
            return jsonify([email.model_dump() for email in emails])
        except Exception as e:
            logger.error(f"Error fetching emails for account {account_id}: {e}")
            return jsonify({"error": "Failed to fetch emails"}), 500

    @app.route('/api/emails/<int:email_id>', methods=['GET'])
    def get_email(email_id):
        """Get a specific email with magic links extracted."""
        try:
            email = storage.get_email_message(email_id)
            if not email:
                return jsonify({"error": "Email not found"}), 404
                
            # Mark email as read
            email = storage.mark_email_as_read(email_id)
            
            # Extract magic links
            content_to_check = email.html_content or email.content
            magic_links = extract_magic_links(content_to_check)
            
            # Create EmailMessageWithMagicLinks
            email_dict = email.model_dump()
            email_dict["magic_links"] = magic_links
            result = EmailMessageWithMagicLinks(**email_dict)
            
            return jsonify(result.model_dump())
        except Exception as e:
            logger.error(f"Error fetching email {email_id}: {e}")
            return jsonify({"error": "Failed to fetch email"}), 500

    @app.route('/api/simulate/receive-email', methods=['POST'])
    def simulate_receive_email():
        """Simulate receiving an email (for testing)."""
        try:
            data = request.json
            create_request = CreateEmailRequest(**data)
            
            # Verify the account exists
            account = storage.get_email_account(create_request.account_id)
            if not account:
                return jsonify({"error": "Account not found"}), 404
                
            # Create the email message
            message_data = create_request.model_dump()
            message = storage.create_email_message(message_data)
            
            return jsonify(message.model_dump()), 201
        except ValidationError as e:
            return jsonify({"error": "Validation error", "details": str(e)}), 400
        except Exception as e:
            logger.error(f"Error simulating email receipt: {e}")
            return jsonify({"error": "Failed to simulate email receipt"}), 500
            
    # Add a simple static HTML page endpoint for testing
    @app.route('/static-email')
    def static_email():
        return app.send_static_file('static-email.html')

    return app