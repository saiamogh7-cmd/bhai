from typing import Dict, Any, List, Literal
from backend.app.services.redirect_chain import follow_redirects
from backend.app.services.domain_intel import get_domain_age_days, check_ssl, extract_hostname
from backend.app.services.reputation import check_reputation
from backend.app.services.header_parser import parse_email_text
from backend.app.services.spoof_rules import check_typosquatting, check_rules, OFFICIAL_DOMAINS
from backend.app.services.llm_classifier import classify_email_llm

def assess_qr_risk(url: str) -> Dict[str, Any]:
    """
    Computes a composite risk score and verdict for a scanned QR URL.
    Returns: { "verdict": "HIGH"|"MEDIUM"|"LOW", "score": int, "reasons": List[str], "source": "qr" }
    """
    reasons = []
    score = 0
    
    # 1. Follow redirects
    hops, final_url = follow_redirects(url, timeout=5.0)
    final_hostname = extract_hostname(final_url)
    
    # Add hop count reason if redirecting
    if len(hops) > 1:
        reasons.append(f"Redirect chain detected: URL hopped {len(hops) - 1} times to reach {final_url}.")
        if len(hops) >= 3:
            score += 20
            reasons.append("High number of redirects (3+ hops) is commonly used to mask malicious sites.")
            
    # 2. Check reputation (Safe Browsing & VirusTotal)
    is_malicious, rep_reasons = check_reputation(final_url)
    if is_malicious:
        score += 80
        reasons.extend(rep_reasons)
        
    # 3. Check SSL status
    ssl_status, ssl_detail = check_ssl(final_url, port=443, timeout=3.0)
    if ssl_status == "no-ssl":
        # Plain HTTP or no SSL port open
        score += 30
        reasons.append("Target site does not use HTTPS / valid SSL certificate.")
    elif ssl_status == "expired":
        score += 50
        reasons.append("SSL certificate is expired, posing a security risk.")
    elif ssl_status == "self-signed":
        score += 50
        reasons.append("SSL certificate is self-signed or from an untrusted Certificate Authority.")
    elif ssl_status == "hostname-mismatch":
        score += 30
        reasons.append("SSL certificate hostname mismatch (domain does not match the certificate).")
        
    # 4. Check WHOIS age
    age_days = get_domain_age_days(final_url)
    if age_days is not None:
        if age_days < 30:
            score += 45
            reasons.append(f"Domain is extremely new (registered {age_days} days ago).")
        elif age_days < 180:
            score += 20
            reasons.append(f"Domain is relatively new (registered {age_days} days ago).")
    else:
        # Whois lookup not available or failed
        reasons.append("Domain WHOIS record is unavailable or lookup failed.")
        
    # Cap score
    score = min(max(score, 0), 100)
    
    # Verdict mapping
    if score >= 70:
        verdict = "HIGH"
    elif score >= 30:
        verdict = "MEDIUM"
    else:
        verdict = "LOW"
        
    if not reasons:
        reasons.append("Domain has a clean reputation record, valid SSL, and is well-established.")
        
    return {
        "verdict": verdict,
        "score": score,
        "reasons": reasons,
        "source": "qr"
    }

def assess_email_risk(raw_email: str) -> Dict[str, Any]:
    """
    Computes a composite risk score and verdict for raw email content.
    Returns: { "verdict": "HIGH"|"MEDIUM"|"LOW", "score": int, "reasons": List[str], "source": "email" }
    """
    reasons = []
    score = 0
    
    # 1. Parse headers and body
    email_data = parse_email_text(raw_email)
    body = email_data["body"]
    subject = email_data["subject"]
    display_name = email_data["display_name"].lower()
    from_address = email_data["from_address"].lower()
    from_domain = email_data["from_domain"]
    reply_to_domain = email_data["reply_to_domain"]
    return_path_domain = email_data["return_path_domain"]
    
    # 2. Check for display-name spoofing
    # e.g., display name contains official trademarks, but domain is not official
    official_keywords = ["fifa", "world cup", "worldcup", "ticketing", "sponsor", "visa", "coca-cola", "adidas"]
    has_official_name = any(kw in display_name for kw in official_keywords)
    
    if has_official_name:
        is_official_domain = from_domain in OFFICIAL_DOMAINS
        if not is_official_domain:
            score += 65
            reasons.append(
                f"Display-name spoofing detected: Sender name ('{email_data['display_name']}') "
                f"claims official branding, but sender email domain ('{from_domain or 'unknown'}') is external."
            )
            
    # 3. Check for typosquatting of official domains
    is_typo, typo_reason = check_typosquatting(from_domain)
    if is_typo and typo_reason:
        score += 55
        reasons.append(typo_reason)
        
    # 4. Check deterministic prefilter rules (Urgency, Claim Solicitation, Zero-payload)
    rules_flagged, rule_score, rule_reasons = check_rules(body, subject)
    if rules_flagged:
        score += rule_score
        reasons.extend(rule_reasons)
        
    # 5. Check LLM Zero-shot classifier
    llm_result = classify_email_llm(body, subject)
    if llm_result.get("is_scam_pattern"):
        confidence = llm_result.get("confidence", 0)
        llm_reasoning = llm_result.get("reasoning", "")
        # Add score weighting based on LLM classification
        score += int(60 * (confidence / 100.0))
        reasons.append(
            f"LLM AI classified content as a zero-payload 'reply-to-claim' scam "
            f"(Confidence: {confidence}%). Reasoning: {llm_reasoning}"
        )
        
    # 6. Check Reply-To and Return-Path alignments
    if reply_to_domain and from_domain and reply_to_domain != from_domain:
        score += 25
        reasons.append(
            f"Header mismatch: Reply-To domain ('{reply_to_domain}') "
            f"does not match From domain ('{from_domain}')."
        )
        
    if return_path_domain and from_domain and return_path_domain != from_domain:
        score += 15
        reasons.append(
            f"Header mismatch: Return-Path domain ('{return_path_domain}') "
            f"does not match From domain ('{from_domain}')."
        )
        
    # Cap score
    score = min(max(score, 0), 100)
    
    # Verdict mapping
    if score >= 60:
        verdict = "HIGH"
    elif score >= 25:
        verdict = "MEDIUM"
    else:
        verdict = "LOW"
        
    if not reasons:
        reasons.append("Email contains no suspicious headers, spoofs, or urgent solicitor patterns.")
        
    return {
        "verdict": verdict,
        "score": score,
        "reasons": reasons,
        "source": "email"
    }
