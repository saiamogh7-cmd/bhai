import re
from typing import Tuple, Optional, List

OFFICIAL_DOMAINS = [
    "fifa.com",
    "fifaworldcup.com",
    "visa.com",
    "qatarairways.com",
    "hyundai.com",
    "coca-cola.com",
    "adidas.com",
    "budweiser.com"
]

URGENCY_KEYWORDS = [
    r"urgent",
    r"immediately",
    r"within \d+ hours",
    r"expire",
    r"expired",
    r"action required",
    r"last chance",
    r"limited seats",
    r"suspend",
    r"suspension",
    r"lock out",
    r"locked out",
    r"deactivate",
    r"deactivation",
    r"restrict",
    r"terminate"
]

REPLY_TO_CLAIM_KEYWORDS = [
    r"reply to this email",
    r"reply back",
    r"claim your ticket",
    r"claim your refund",
    r"claim your prize",
    r"refund your ticket",
    r"ticket refund",
    r"winner",
    r"congratulations",
    r"win free",
    r"free tickets",
    r"re-authenticate",
    r"verify password",
    r"update password",
    r"session expired",
    r"verify your identity"
]

QUISHING_KEYWORDS = [
    r"scan the qr",
    r"scan qr",
    r"qr code below",
    r"smartphone to re-authenticate",
    r"smartphone to authenticate",
    r"scan with your smartphone",
    r"scan this qr",
    r"qr code to re-authenticate"
]

def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def check_typosquatting(domain: str) -> Tuple[bool, Optional[str]]:
    """
    Checks if a domain is a typosquatting attempt of any of the official domains.
    Returns (is_typosquatted, reason_message)
    """
    domain = domain.lower().strip()
    if not domain:
        return False, None
        
    if domain in OFFICIAL_DOMAINS:
        return False, None
        
    domain_name = domain.split(".")[0]
    
    for official in OFFICIAL_DOMAINS:
        official_name = official.split(".")[0]
        
        # 1. Direct Levenshtein distance check on domain prefixes
        dist = levenshtein_distance(domain_name, official_name)
        if 1 <= dist <= 2:
            return True, f"Domain name '{domain}' is typographically similar (Levenshtein distance {dist}) to official domain '{official}'."
            
        # 2. Substring containing official name but extra fluff (e.g. fifa-tickets.com)
        if official_name in domain_name and domain_name != official_name:
            return True, f"Domain name '{domain}' contains official trademark '{official_name}' but is not an official domain."
            
    return False, None

def check_rules(body: str, subject: str) -> Tuple[bool, int, List[str]]:
    """
    Checks the email body and subject for deterministic urgency, reply-to-claim scams, and QR phishing (quishing).
    Returns (is_flagged, rule_score, reasons)
    """
    text = (subject + " " + body).lower()
    reasons = []
    score = 0
    
    # Check for urgency
    urgency_found = [pat for pat in URGENCY_KEYWORDS if re.search(pat, text)]
    if urgency_found:
        score += 25
        reasons.append("Urgency cues detected (e.g., action required, expired session, or account lockout warning).")
        
    # Check for claim/refund language
    claim_found = [pat for pat in REPLY_TO_CLAIM_KEYWORDS if re.search(pat, text)]
    if claim_found:
        score += 35
        reasons.append("Scam solicitation or identity verification language detected (e.g., 're-authenticate', 'refund your ticket').")
        
    # Check for quishing (QR phishing) keywords
    quishing_found = [pat for pat in QUISHING_KEYWORDS if re.search(pat, text)]
    if quishing_found:
        score += 35
        reasons.append("QR Code scanning request (Quishing indicator) detected in email content.")
        
    # Check for zero-payload check (no URLs/links)
    has_links = bool(re.search(r"https?://[^\s]+", text))
    if not has_links and (claim_found or quishing_found):
        score += 30
        reasons.append("Zero-payload scan signature: encourages direct response or offline QR scanning with no suspicious links.")
        
    return (score > 0), score, reasons
