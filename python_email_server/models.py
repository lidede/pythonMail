from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator

class EmailAccount(BaseModel):
    id: int
    username: str
    domain: str
    email: str
    password: str
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        from_attributes = True

class CreateAccountRequest(BaseModel):
    username: str
    domain: str
    password: str
    confirm_password: str
    
    @validator('username')
    def username_must_be_valid(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.replace('.', '').replace('-', '').replace('_', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, dots, hyphens, and underscores')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class EmailMessage(BaseModel):
    id: int
    account_id: int
    sender: str
    sender_email: str
    recipient: str
    subject: str
    content: str
    html_content: Optional[str] = None
    received_at: datetime = Field(default_factory=datetime.now)
    read: bool = False
    headers: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

class EmailMessageWithMagicLinks(EmailMessage):
    magic_links: List[str] = []

class EmailAccountWithUnread(EmailAccount):
    unread_count: int = 0

class CreateEmailRequest(BaseModel):
    account_id: int
    sender: str
    sender_email: str
    recipient: str
    subject: str
    content: str
    html_content: Optional[str] = None
    headers: Dict[str, Any] = {}