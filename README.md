# OpenMail - Python Email Server

An open-source email server written in Python that allows you to create email addresses, receive emails from external senders, and view email content including magic links.

## Features

- **Account Management**: Create and manage email accounts
- **Email Reception**: Receive emails through SMTP
- **Magic Link Detection**: Automatically extract magic links from emails
- **REST API**: HTTP endpoints for controlling the server
- **In-Memory Storage**: Lightweight storage system (can be extended)

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/openmail.git
cd openmail
```

### 2. Install dependencies

```bash
pip install flask pydantic aiosmtpd python-dotenv
```

### 3. Configure environment variables (optional)

Create a `.env` file in the root directory to customize settings:

```
# API server port
PORT=8000

# SMTP server settings
SMTP_PORT=2525
SMTP_HOST=0.0.0.0
```

## Running the Server

To start the server:

```bash
python run.py
```

This will:
- Start the Flask API server on port 8000 (or PORT from environment)
- Start the SMTP server on port 2525 (or SMTP_PORT from environment)

## Deployment Options

### Option 1: Deploy on a VPS or dedicated server

1. **Set up a server with Python**:
   - Ubuntu/Debian: `sudo apt update && sudo apt install -y python3 python3-pip`
   - CentOS/RHEL: `sudo yum install -y python3 python3-pip`

2. **Install dependencies**:
   ```bash
   pip3 install flask pydantic aiosmtpd python-dotenv gunicorn
   ```

3. **Set up a production WSGI server**:
   Create a `wsgi.py` file:
   ```python
   from python_email_server.main import create_app, start_smtp_server
   
   # Start the SMTP server
   smtp_server = start_smtp_server()
   
   # Create the Flask application
   app = create_app()
   
   if __name__ == "__main__":
       app.run()
   ```

4. **Run with Gunicorn**:
   ```bash
   gunicorn --bind 0.0.0.0:8000 wsgi:app
   ```

5. **Set up as a service**:
   Create `/etc/systemd/system/openmail.service`:
   ```
   [Unit]
   Description=OpenMail Python Email Server
   After=network.target
   
   [Service]
   User=youruser
   WorkingDirectory=/path/to/openmail
   ExecStart=/usr/local/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 wsgi:app
   Restart=on-failure
   
   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start the service:
   ```bash
   sudo systemctl enable openmail.service
   sudo systemctl start openmail.service
   ```

### Option 2: Deploy with Docker

1. **Create a Dockerfile**:
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 8000 2525
   
   CMD ["python", "run.py"]
   ```

2. **Create requirements.txt**:
   ```
   flask
   pydantic
   aiosmtpd
   python-dotenv
   ```

3. **Build and run the Docker image**:
   ```bash
   docker build -t openmail .
   docker run -p 8000:8000 -p 2525:2525 openmail
   ```

### Option 3: Deploy on a PaaS (e.g., Heroku)

1. **Create a Procfile**:
   ```
   web: gunicorn --bind 0.0.0.0:$PORT wsgi:app
   worker: python -m python_email_server.smtp_standalone
   ```

2. **Create smtp_standalone.py**:
   ```python
   from python_email_server.smtp_server import SMTPServer
   import os
   
   def main():
       port = int(os.getenv('SMTP_PORT', '2525'))
       host = os.getenv('SMTP_HOST', '0.0.0.0')
       
       smtp_server = SMTPServer(host=host, port=port)
       smtp_server.start()
       
       # Keep the process running
       try:
           import time
           while True:
               time.sleep(86400)  # Sleep for a day
       except KeyboardInterrupt:
           smtp_server.stop()
   
   if __name__ == "__main__":
       main()
   ```

3. **Deploy to Heroku**:
   ```bash
   heroku create
   git push heroku main
   heroku ps:scale web=1 worker=1
   ```

## Production Considerations

### SMTP Configuration

In production, you should configure:

1. **Domain Records**:
   - Set up proper MX records pointing to your server
   - Configure SPF, DKIM and DMARC for improved deliverability

2. **Use a real SMTP port**:
   - Standard SMTP uses port 25
   - Submission typically uses port 587 or 465 (TLS)
   - Update `.env` file to use appropriate ports

3. **TLS/SSL Support**:
   - Generate certificates (Let's Encrypt is free)
   - Configure the SMTP server to use TLS

### Data Persistence

The default implementation uses in-memory storage which doesn't persist across restarts. For production:

1. **Add database support**:
   - Integrate with PostgreSQL, MySQL, or another database
   - Modify the storage class to use the database

2. **Backup strategy**:
   - Implement regular backups of email data
   - Consider replication for high availability

### Security Recommendations

1. **User Authentication**:
   - Add proper authentication for API endpoints
   - Implement rate limiting to prevent abuse

2. **Email Validation**:
   - Implement spam filtering
   - Add virus scanning for attachments

3. **API Security**:
   - Use HTTPS for the API
   - Implement proper access controls

## API Documentation

### Email Account Endpoints

- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create a new account

### Email Endpoints

- `GET /api/accounts/:id/emails` - Get all emails for an account
- `GET /api/emails/:id` - Get a specific email with magic links
- `POST /api/simulate/receive-email` - Simulate receiving an email (for testing)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.