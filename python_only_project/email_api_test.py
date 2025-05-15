#!/usr/bin/env python3

"""
Test script for our Python email server
"""

from python_email_server.storage import storage
from python_email_server.models import EmailAccount, EmailMessage

def test_storage():
    """Test basic storage operations."""
    print("Testing email accounts...")
    accounts = storage.get_email_accounts()
    for account in accounts:
        print(f"Account: {account.email}")
        
        print(f"Fetching emails for {account.email}...")
        emails = storage.get_email_messages(account.id)
        for email in emails:
            print(f"  Email: {email.subject}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_storage()