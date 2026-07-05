import socket
import ssl
import urllib.parse
from datetime import datetime
from typing import Optional, Tuple
import whois

def extract_hostname(url: str) -> str:
    """Extracts the hostname (e.g. www.fifa.com) from a URL."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc or parsed.path.split("/")[0]

def get_domain_age_days(url: str) -> Optional[int]:
    """
    Performs a WHOIS query to determine the registration age of the domain in days.
    """
    hostname = extract_hostname(url)
    try:
        w = whois.whois(hostname)
        creation_date = w.creation_date
        
        # creation_date can be a list of dates (for multiple registrars/entries) or a single date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
            
        if isinstance(creation_date, datetime):
            age = (datetime.utcnow() - creation_date).days
            return age
    except Exception as e:
        print(f"WHOIS lookup failed for {hostname}: {e}")
    return None

def check_ssl(url: str, port: int = 443, timeout: float = 3.0) -> Tuple[str, str]:
    """
    Checks the SSL certificate of a URL's host.
    Returns (status, detail_message) where status is one of:
      - 'valid': Fully trusted and matching certificate
      - 'expired': Certificate is expired
      - 'self-signed': Untrusted certificate (e.g. self-signed)
      - 'hostname-mismatch': Valid certificate but doesn't match hostname
      - 'no-ssl': Unable to connect/establish SSL (e.g. plain HTTP, port closed)
    """
    if url.startswith("http://"):
        # Explicitly return no-ssl for plain HTTP URLs to avoid waiting for timeouts
        # but let's check if the port is open or if we can establish a connection.
        # Actually, let's check SSL anyway, or if it has no SSL, return no-ssl.
        pass

    hostname = extract_hostname(url)
    
    # 1. Attempt fully valid connection
    context = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                # Success means trusted, matching, and active
                return "valid", "SSL certificate is valid and trusted."
    except ssl.SSLCertVerificationError as e:
        err_msg = str(e).lower()
        if "expired" in err_msg or "certificate has expired" in err_msg:
            return "expired", "SSL certificate has expired."
        elif "self signed" in err_msg or "self-signed" in err_msg or "local issuer" in err_msg:
            return "self-signed", "SSL certificate is self-signed or untrusted."
        else:
            return "self-signed", f"SSL certificate verification failed: {e.reason}"
    except ssl.CertificateError as e:
        return "hostname-mismatch", f"SSL hostname mismatch: {e}"
    except ssl.SSLError as e:
        err_msg = str(e).lower()
        # Fallback inspection of SSLError messages
        if "hostname" in err_msg or "match" in err_msg:
            return "hostname-mismatch", "SSL hostname mismatch."
        elif "expired" in err_msg:
            return "expired", "SSL certificate has expired."
        elif "self signed" in err_msg or "self-signed" in err_msg or "local issuer" in err_msg:
            return "self-signed", "SSL certificate is self-signed or untrusted."
        
        # 2. Check if it's a hostname mismatch specifically by disabling check_hostname
        try:
            context_no_host = ssl.create_default_context()
            context_no_host.check_hostname = False
            with socket.create_connection((hostname, port), timeout=timeout) as sock:
                with context_no_host.wrap_socket(sock) as ssock:
                    return "hostname-mismatch", "Certificate is valid, but hostname does not match."
        except ssl.SSLCertVerificationError as e2:
            err2_msg = str(e2).lower()
            if "expired" in err2_msg or "certificate has expired" in err2_msg:
                return "expired", "SSL certificate has expired."
            return "self-signed", "SSL certificate is self-signed or untrusted."
        except Exception:
            return "self-signed", f"SSL handshake error: {e}"
    except (socket.timeout, ConnectionRefusedError, socket.gaierror) as e:
        return "no-ssl", "No SSL found or failed to connect."
    except Exception as e:
        return "no-ssl", f"SSL check error: {e}"
