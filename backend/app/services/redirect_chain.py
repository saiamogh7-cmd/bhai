import requests
import urllib3
import time
import urllib.parse
from typing import List, Tuple

# Suppress insecure request warnings from urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def follow_redirects(url: str, timeout: float = 5.0) -> Tuple[List[str], str]:
    """
    Follows a URL's redirect chain manually and returns a list of all hopped URLs and the final URL.
    Enforces a strict global timeout across all hops, and a maximum hop count to prevent infinite loops.
    Uses requests.get with stream=True and verify=False.
    """
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    hops = [url]
    current_url = url
    max_hops = 5
    start_time = time.time()
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    session = requests.Session()
    session.verify = False

    for _ in range(max_hops):
        elapsed = time.time() - start_time
        remaining = timeout - elapsed
        if remaining <= 0.5:  # Buffer of 0.5s to avoid hitting exact limits
            break

        try:
            # allow_redirects=False is critical to catch each redirect header manually
            response = session.get(current_url, headers=headers, allow_redirects=False, timeout=remaining, stream=True)
            
            # 3xx redirect status codes
            next_url = None
            if response.status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("Location")
                if not location:
                    break
                next_url = urllib.parse.urljoin(current_url, location)
            elif response.status_code == 200:
                # Check for meta-refresh HTML redirects
                content_type = response.headers.get("Content-Type", "").lower()
                if "text/html" in content_type:
                    try:
                        # Read first 10KB of HTML content
                        content_chunk = response.raw.read(10240).decode("utf-8", errors="ignore")
                        import re
                        match = re.search(
                            r'<meta\s+[^>]*http-equiv=["\']refresh["\'][^>]*content=["\']\d+;\s*url=([^"\']+)["\']',
                            content_chunk,
                            re.IGNORECASE
                        )
                        if match:
                            location = match.group(1).strip()
                            next_url = urllib.parse.urljoin(current_url, location)
                    except Exception:
                        pass
            
            if not next_url:
                break
                
            # Loop detection
            if next_url in hops:
                break
                
            hops.append(next_url)
            current_url = next_url
        except requests.RequestException as e:
            print(f"Error following redirect for {current_url}: {e}")
            break

    return hops, current_url


