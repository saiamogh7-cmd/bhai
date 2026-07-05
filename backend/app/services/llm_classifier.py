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

    # API Endpoint for Gemini 1.5 Flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = f"""You are an expert security classifier detecting World Cup 2026 fan scam emails.
Specifically, you are looking for the "reply-to-claim" scam pattern.
This pattern is characterized by:
1. No links or attachments (so traditional email scanners ignore them).
2. Urgently prompting the user to reply directly to the email to claim ticket refunds, ticket allocations, giveaways, or prizes.
3. Often claiming to be official FIFA or World Cup personnel or sponsors, but using non-official domains.

Here are reference examples:

Example 1 (Scam "reply-to-claim"):
Subject: CONGRATULATIONS! World Cup Ticket Refund
Body: Dear Fan, we noticed you paid twice for your World Cup final tickets. To receive your refund of $450 immediately, please reply directly to this email with your name, phone number, and bank details. Do not contact support, reply here.

Example 2 (Safe/Legitimate):
Subject: FIFA World Cup 2026 Purchase Confirmation
Body: Hello John, this email confirms your purchase of 2 tickets to Match 14. Your booking reference is XYZ123. You can access your mobile tickets in your official FIFA ticketing portal. Do not reply to this automated message.

Example 3 (Scam "reply-to-claim"):
Subject: Urgent: World Cup Ticket Allocation
Body: Hello, you have been selected for a special allocation of VIP tickets. Please reply to this message within 24 hours to secure your seats.

Example 4 (Safe/Legitimate):
Subject: Reminder: World Cup match start time
Body: Hi, this is a reminder that Match 4 starts in 3 hours. Please arrive early at the stadium.

Please classify the following email:
Subject: {subject}
Body: {body}

Respond strictly with a JSON object containing the keys:
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
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "is_scam_pattern": {"type": "BOOLEAN"},
                    "confidence": {"type": "INTEGER"},
                    "reasoning": {"type": "STRING"}
                },
                "required": ["is_scam_pattern", "confidence", "reasoning"]
            }
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=5.0)
        if response.status_code == 200:
            res_data = response.json()
            # Extract text from response structure
            candidates = res_data.get("candidates", [])
            if candidates:
                text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text_content:
                    parsed_result = json.loads(text_content.strip())
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
