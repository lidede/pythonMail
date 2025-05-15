"""
WSGI entry point for production deployment
"""

from python_email_server.main import create_app, start_smtp_server

# Start the SMTP server
smtp_server = start_smtp_server()

# Create the Flask application
app = create_app()

if __name__ == "__main__":
    app.run()