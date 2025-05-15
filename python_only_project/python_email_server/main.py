import os
import logging
from flask import Flask
from dotenv import load_dotenv

from .api import init_routes
from .smtp_server import SMTPServer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder='static')
    
    # Initialize API routes
    init_routes(app)
    
    return app

def start_smtp_server():
    """Start the SMTP server."""
    smtp_port = int(os.getenv('SMTP_PORT', '2525'))  # Use port 2525 instead of 25
    smtp_host = os.getenv('SMTP_HOST', '0.0.0.0')
    
    smtp_server = SMTPServer(host=smtp_host, port=smtp_port)
    smtp_server.start()
    
    return smtp_server

def main():
    """Main entry point for the application."""
    # Create the Flask app
    app = create_app()
    
    # Start the SMTP server
    smtp_server = start_smtp_server()
    
    # Get port from environment or use default
    port = int(os.getenv('PORT', '8000'))  # Use port 8000 which is less likely to be in use
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port)
    
    return app, smtp_server

if __name__ == '__main__':
    main()