import email
from email.utils import parseaddr
from typing import Dict, Any

def parse_email_text(raw_email: str) -> Dict[str, Any]:
    """
    Parses raw email text containing headers and body.
    Extracts key fields like From, Subject, Reply-To, and the text body.
    """
    # Parse the email structure
    msg = email.message_from_string(raw_email)
    
    from_header = msg.get("From", "")
    reply_to_header = msg.get("Reply-To", "")
    return_path_header = msg.get("Return-Path", "")
    subject = msg.get("Subject", "")
    
    display_name, from_address = parseaddr(from_header)
    _, reply_to_address = parseaddr(reply_to_header)
    _, return_path_address = parseaddr(return_path_header)
    
    # If parseaddr returns empty for return_path (e.g. if formatted as <user@domain.com>), strip angle brackets
    if not return_path_address and return_path_header:
        return_path_address = return_path_header.strip("<>").strip()

    from_domain = from_address.split("@")[-1].strip().lower() if "@" in from_address else ""
    reply_to_domain = reply_to_address.split("@")[-1].strip().lower() if "@" in reply_to_address else ""
    return_path_domain = return_path_address.split("@")[-1].strip().lower() if "@" in return_path_address else ""

    # Extract body content
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    body += payload.decode(errors="ignore")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            body = payload.decode(errors="ignore")

    # Fallback: if no valid headers were parsed, assume the user pasted the direct message body
    if not from_header and not subject:
        body = raw_email

    return {
        "from_header": from_header,
        "display_name": display_name,
        "from_address": from_address,
        "from_domain": from_domain,
        "reply_to": reply_to_address,
        "reply_to_domain": reply_to_domain,
        "return_path": return_path_address,
        "return_path_domain": return_path_domain,
        "subject": subject,
        "body": body.strip()
    }
