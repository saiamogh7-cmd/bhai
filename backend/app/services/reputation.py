import os
import requests
import urllib.parse
from typing import Tuple, List, Dict, Any

# In-memory reputation cache: domain/host -> {"is_flagged": bool, "reasons": List[str]}
reputation_cache: Dict[str, Dict[str, Any]] = {}

def extract_domain(url: str) -> str:
    """Helper to extract the domain/host from a URL."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urllib.parse.urlparse(url)
    netloc = parsed.netloc or parsed.path.split("/")[0]
    if "@" in netloc:
        netloc = netloc.split("@")[-1]
    if ":" in netloc:
        netloc = netloc.split(":")[0]
    return netloc

def check_reputation(url: str) -> Tuple[bool, List[str]]:
    """
    Checks the reputation of a URL/domain using Google Safe Browsing (Lookup API v4)
    and VirusTotal (v3 Domain API). Results are cached in-memory by domain.
    """
    domain = extract_domain(url).lower()
    
    # Check cache first
    if domain in reputation_cache:
        print(f"Reputation cache hit for domain: {domain}")
        cached = reputation_cache[domain]
        return cached["is_flagged"], cached["reasons"]
        
    is_flagged = False
    reasons = []
    
    safe_browsing_key = os.getenv("SAFE_BROWSING_API_KEY")
    virustotal_key = os.getenv("VIRUSTOTAL_API_KEY")
    
    # 1. Google Safe Browsing Lookup v4 Check
    if safe_browsing_key:
        try:
            sb_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={safe_browsing_key}"
            payload = {
                "client": {"clientId": "fan-fraud-shield", "clientVersion": "1.0.0"},
                "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}]
                }
            }
            response = requests.post(sb_url, json=payload, timeout=4.0)
            if response.status_code == 200:
                data = response.json()
                if "matches" in data and len(data["matches"]) > 0:
                    is_flagged = True
                    threat_type = data["matches"][0].get("threatType", "Phishing/Malware")
                    reasons.append(f"Google Safe Browsing flagged URL as {threat_type.replace('_', ' ')}.")
            else:
                print(f"Safe Browsing API returned status code {response.status_code}")
        except Exception as e:
            print(f"Safe Browsing API check failed: {e}")
            
    # 2. VirusTotal v3 Domain Check
    if virustotal_key and domain:
        try:
            vt_url = f"https://www.virustotal.com/api/v3/domains/{domain}"
            headers = {"x-apikey": virustotal_key}
            response = requests.get(vt_url, headers=headers, timeout=4.0)
            if response.status_code == 200:
                data = response.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                
                if malicious > 1:
                    is_flagged = True
                    reasons.append(f"VirusTotal flagged domain as malicious ({malicious} engines).")
                elif suspicious > 1:
                    is_flagged = True
                    reasons.append(f"VirusTotal flagged domain as suspicious ({suspicious} engines).")
            elif response.status_code == 404:
                # Domain not known to VirusTotal, which is fine
                pass
            else:
                print(f"VirusTotal API returned status code {response.status_code}")
        except Exception as e:
            print(f"VirusTotal API check failed: {e}")
            
    # Cache the result
    reputation_cache[domain] = {
        "is_flagged": is_flagged,
        "reasons": reasons
    }
    
    return is_flagged, reasons
