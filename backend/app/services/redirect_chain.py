import requests
import urllib3
from typing import List, Tuple

# Suppress insecure request warnings from urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def follow_redirects(url: str, timeout: float = 5.0) -> Tuple[List[str], str]:
    """
    Follows a URL's redirect chain and returns a list of all hopped URLs and the final URL.
    Uses requests.get with stream=True and a timeout. Bypasses SSL validation errors to reach final target.
    """
    # Ensure URL has a protocol
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        # stream=True avoids reading the response content body, keeping redirect checks extremely fast.
        # Set a generic user-agent to avoid simple scraping blocks.
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        # verify=False is critical to trace redirects through expired or untrusted domains.
        response = requests.get(url, headers=headers, allow_redirects=True, timeout=timeout, stream=True, verify=False)
        
        # response.history contains the redirection chain responses (ordered oldest -> newest)
        hops = [resp.url for resp in response.history]
        hops.append(response.url)
        
        return hops, response.url
    except requests.RequestException as e:
        # Gracefully degrade: return the original URL as the sole hop and destination
        print(f"Error following redirects for {url}: {e}")
        return [url], url

