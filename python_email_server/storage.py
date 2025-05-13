from typing import Dict, List, Optional, Any
from datetime import datetime

from .models import EmailAccount, EmailMessage


class Storage:
    """In-memory storage for the email server."""
    
    def __init__(self):
        self.email_accounts: Dict[int, EmailAccount] = {}
        self.email_messages: Dict[int, EmailMessage] = {}
        self.account_current_id = 1
        self.message_current_id = 1
        
        # Create some initial accounts for demo purposes
        self._seed_data()
        
    def _seed_data(self):
        """Add some example email accounts."""
        accounts = [
            {
                "username": "john.doe",
                "domain": "openmail.org",
                "email": "john.doe@openmail.org",
                "password": "password123"
            },
            {
                "username": "dev",
                "domain": "openmail.org",
                "email": "dev@openmail.org",
                "password": "password123"
            },
            {
                "username": "support",
                "domain": "openmail.org",
                "email": "support@openmail.org",
                "password": "password123"
            }
        ]
        
        for account_data in accounts:
            self.create_email_account(account_data)
            
    # Email Account Methods
    def get_email_accounts(self) -> List[EmailAccount]:
        """Get all email accounts."""
        return list(self.email_accounts.values())
    
    def get_email_account(self, account_id: int) -> Optional[EmailAccount]:
        """Get an email account by ID."""
        return self.email_accounts.get(account_id)
    
    def get_email_account_by_email(self, email: str) -> Optional[EmailAccount]:
        """Get an email account by email address."""
        email = email.lower()
        for account in self.email_accounts.values():
            if account.email.lower() == email:
                return account
        return None
    
    def create_email_account(self, account_data: Dict[str, Any]) -> EmailAccount:
        """Create a new email account."""
        account_id = self.account_current_id
        self.account_current_id += 1
        
        account = EmailAccount(
            id=account_id,
            username=account_data["username"],
            domain=account_data["domain"],
            email=account_data["email"],
            password=account_data["password"],
            created_at=datetime.now()
        )
        
        self.email_accounts[account_id] = account
        return account
    
    # Email Message Methods
    def get_email_messages(self, account_id: int) -> List[EmailMessage]:
        """Get all email messages for an account."""
        messages = [
            msg for msg in self.email_messages.values()
            if msg.account_id == account_id
        ]
        # Sort by received_at, newest first
        return sorted(messages, key=lambda x: x.received_at, reverse=True)
    
    def get_email_message(self, message_id: int) -> Optional[EmailMessage]:
        """Get an email message by ID."""
        return self.email_messages.get(message_id)
    
    def create_email_message(self, message_data: Dict[str, Any]) -> EmailMessage:
        """Create a new email message."""
        message_id = self.message_current_id
        self.message_current_id += 1
        
        # Ensure html_content is string or None
        html_content = message_data.get("html_content")
        if html_content is None and "html_content" in message_data:
            html_content = None
            
        # Ensure headers is a dict
        headers = message_data.get("headers", {})
        
        message = EmailMessage(
            id=message_id,
            account_id=message_data["account_id"],
            sender=message_data["sender"],
            sender_email=message_data["sender_email"],
            recipient=message_data["recipient"],
            subject=message_data["subject"],
            content=message_data["content"],
            html_content=html_content,
            headers=headers,
            received_at=datetime.now(),
            read=False
        )
        
        self.email_messages[message_id] = message
        return message
    
    def mark_email_as_read(self, message_id: int) -> EmailMessage:
        """Mark an email message as read."""
        message = self.get_email_message(message_id)
        if not message:
            raise ValueError(f"Email message with id {message_id} not found")
        
        message.read = True
        return message
    
    def get_unread_count(self, account_id: int) -> int:
        """Get the number of unread email messages for an account."""
        return sum(
            1 for msg in self.email_messages.values()
            if msg.account_id == account_id and not msg.read
        )


# Create a singleton instance of Storage
storage = Storage()