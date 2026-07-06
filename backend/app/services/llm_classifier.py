import os
import json
import requests
from typing import Dict, Any

def classify_email_llm(body: str, subject: str) -> Dict[str, Any]:
    """
    Calls the Gemini API to classify an email body/subject for "reply-to-claim" scam pattern.
    Returns: { "is_scam_pattern": bool, "confidence": int, "reasoning": str }
    Falls back to a default empty classification on error/timeout/missing API key.
    """
    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        print("LLM_API_KEY environment variable is not set. Skipping LLM classification.")
        return {
            "is_scam_pattern": False,
            "confidence": 0,
            "reasoning": "LLM API Key missing, classification unavailable."
        }

    # API Endpoint for Gemini 2.0 Flash (current stable fast model)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    prompt = f"""You are an expert security classifier detecting phishing, scam, and fraud emails.
Specifically, you are looking for the following malicious patterns:
1. The "reply-to-claim" scam: Urgently prompting the user to reply directly to the email to claim refunds, tickets, prizes, or allocations (often World Cup related) with no external links.
2. "Quishing" (QR Code Phishing): Prompting the user to scan a QR code inside the email using their smartphone to re-authenticate, verify passwords, or resolve expired sessions/account locking warnings (e.g., claiming to be Microsoft Support, Google Support, or standard email administrators).
3. Urgency and Account Coercion: Claiming that accounts will be restricted, deactivated, or locked out unless immediate action is taken.

Here are reference examples:

Example 1 (Scam "reply-to-claim"):
Subject: CONGRATULATIONS! World Cup Ticket Refund
Body: Dear Fan, we noticed you paid twice for your World Cup final tickets. To receive your refund of $450 immediately, please reply directly to this email with your name, phone number, and bank details. Do not contact support, reply here.

Example 2 (Safe/Legitimate):
Subject: FIFA World Cup 2026 Purchase Confirmation
Body: Hello John, this email confirms your purchase of 2 tickets to Match 14. Your booking reference is XYZ123. You can access your mobile tickets in your official FIFA ticketing portal. Do not reply to this automated message.

Example 3 (Scam "Quishing" / QR Phishing):
Subject: Action Required: Your Authenticator Session Expired Today
Body: Hello User, Your Authenticator session has expired today. Kindly re-authenticate with your mobile device to avoid being locked out of your email account. Quickly Scan the QR Code below with your smartphone to re-authenticate your password security. Regards, Microsoft Support

Example 4 (Safe/Legitimate):
Subject: Reminder: World Cup match start time
Body: Hi, this is a reminder that Match 4 starts in 3 hours. Please arrive early at the stadium.

Please classify the following email:
Subject: {subject}
Body: {body}

Respond ONLY with a valid JSON object (no markdown, no code fences) containing exactly these keys:
- is_scam_pattern (boolean)
- confidence (integer from 0 to 100)
- reasoning (string containing a brief explanation of your decision)
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 256,
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=8.0)
        if response.status_code == 200:
            res_data = response.json()
            # Extract text from response structure
            candidates = res_data.get("candidates", [])
            if candidates:
                text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text_content:
                    # Strip markdown code fences if present
                    text_content = text_content.strip()
                    if text_content.startswith("```"):
                        text_content = text_content.split("```")[1]
                        if text_content.startswith("json"):
                            text_content = text_content[4:]
                    text_content = text_content.strip()
                    parsed_result = json.loads(text_content)
                    return {
                        "is_scam_pattern": bool(parsed_result.get("is_scam_pattern", False)),
                        "confidence": int(parsed_result.get("confidence", 0)),
                        "reasoning": str(parsed_result.get("reasoning", ""))
                    }
            
            print("Gemini API structure did not contain text content")
        else:
            print(f"Gemini API returned status code {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Error calling Gemini API for email classification: {e}")
        
    return {
        "is_scam_pattern": False,
        "confidence": 0,
        "reasoning": "LLM classification lookup failed or timed out."
    }

