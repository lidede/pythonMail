import re
import email
from email.message import EmailMessage as StandardEmailMessage
from email.policy import default
from typing import Dict, List, Any, Optional, Tuple

class ParsedEmail:
    """Simple class to hold parsed email data."""
    
    def __init__(self):
        self.from_name: str = ""
        self.from_address: str = ""
        self.to: List[str] = []
        self.subject: str = ""
        self.text: str = ""
        self.html: Optional[str] = None
        self.headers: Dict[str, Any] = {}
        self.attachments: List[Dict[str, Any]] = []


def parse_email(email_data: str) -> ParsedEmail:
    """Parse an email message and extract key information."""
    parsed = ParsedEmail()
    
    try:
        # Parse the email message
        msg = email.message_from_string(email_data, policy=default)
        
        # Extract headers
        parsed.headers = dict(msg.items())
        parsed.subject = msg.get('Subject', '')
        
        # Extract sender information
        from_header = msg.get('From', '')
        parsed.from_name, parsed.from_address = _parse_address(from_header)
        
        # Extract recipient information
        to_header = msg.get('To', '')
        for addr in to_header.split(','):
            _, email_addr = _parse_address(addr.strip())
            if email_addr:
                parsed.to.append(email_addr)
        
        # Extract body content
        _extract_content(msg, parsed)
        
    except Exception as e:
        print(f"Error parsing email: {e}")
        
    return parsed


def _parse_address(address: str) -> Tuple[str, str]:
    """Parse an email address into name and actual address."""
    name = ""
    email_addr = ""
    
    # Try to match patterns like "Name <email@example.com>" or just "email@example.com"
    match = re.match(r'"?([^"<]+)"?\s*<?([^>]*)>?', address)
    if match:
        name = match.group(1).strip()
        email_addr = match.group(2).strip() or name
    else:
        email_addr = address.strip()
        
    return name, email_addr


def _extract_content(msg: StandardEmailMessage, parsed: ParsedEmail) -> None:
    """Extract text and HTML content from the email."""
    # Check if the message is multipart
    if msg.is_multipart():
        for part in msg.iter_parts():
            content_type = part.get_content_type()
            if content_type == 'text/plain':
                parsed.text = part.get_content()
            elif content_type == 'text/html':
                parsed.html = part.get_content()
    else:
        # Not multipart, just get the content
        content_type = msg.get_content_type()
        if content_type == 'text/plain':
            parsed.text = msg.get_content()
        elif content_type == 'text/html':
            parsed.html = msg.get_content()
        else:
            parsed.text = str(msg.get_content())


def extract_magic_links(content: str) -> List[str]:
    """Extract magic links from email content."""
    # Regular expression to find URLs
    url_regex = r'https?://[^\s"<>]+'
    
    # Find all URLs in the content
    urls = re.findall(url_regex, content)
    
    # Filter to likely magic links
    magic_links = []
    for url in urls:
        lower_url = url.lower()
        if any(keyword in lower_url for keyword in [
            'token=', 'verify', 'confirm', 'reset', 
            'auth', 'magic', 'login'
        ]):
            magic_links.append(url)
            
    return magic_links