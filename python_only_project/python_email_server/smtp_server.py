import asyncio
import logging
from aiosmtpd.controller import Controller
from aiosmtpd.smtp import SMTP, Envelope, Session

from .email_parser import parse_email
from .storage import storage

logger = logging.getLogger(__name__)

class SMTPHandler:
    """Handler for incoming SMTP connections."""
    
    async def handle_DATA(self, server: SMTP, session: Session, envelope: Envelope) -> str:
        """Handle incoming email data."""
        try:
            recipient = envelope.rcpt_tos[0]
            # Handle both string and bytes content
            if isinstance(envelope.content, bytes):
                email_data = envelope.content.decode('utf-8', errors='replace')
            else:
                email_data = envelope.content
            
            logger.info(f"Received email for: {recipient}")
            
            # Find the account for this recipient
            account = storage.get_email_account_by_email(recipient)
            if not account:
                logger.warning(f"Recipient not found: {recipient}")
                return '550 Recipient address rejected: User unknown'
            
            # Parse the email
            parsed_email = parse_email(email_data)
            
            # Store the email
            message_data = {
                "account_id": account.id,
                "sender": parsed_email.from_name or parsed_email.from_address,
                "sender_email": parsed_email.from_address,
                "recipient": recipient,
                "subject": parsed_email.subject or "(No Subject)",
                "content": parsed_email.text or "",
                "html_content": parsed_email.html,
                "headers": parsed_email.headers
            }
            
            message = storage.create_email_message(message_data)
            logger.info(f"Email stored with ID: {message.id}")
            
            return '250 Message accepted for delivery'
        except Exception as e:
            logger.error(f"Error processing email: {e}")
            return '554 Transaction failed'


class SMTPServer:
    """Simple SMTP server to receive emails."""
    
    def __init__(self, host='0.0.0.0', port=25):
        self.host = host
        self.port = port
        self.controller = None
        
    def start(self):
        """Start the SMTP server."""
        try:
            handler = SMTPHandler()
            self.controller = Controller(handler, hostname=self.host, port=self.port)
            self.controller.start()
            logger.info(f"SMTP server started on {self.host}:{self.port}")
        except (PermissionError, OSError) as e:
            logger.warning(f"Could not start SMTP server on port {self.port}: {e}")
            logger.warning("This is normal in restricted environments.")
            logger.warning("The application will continue, but won't be able to receive emails directly.")
            logger.warning("For testing, use the API endpoints to simulate incoming emails.")
            
    def stop(self):
        """Stop the SMTP server."""
        if self.controller:
            self.controller.stop()
            logger.info("SMTP server stopped")