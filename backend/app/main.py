import os
from typing import List, Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import risk engine assessment functions
from backend.app.risk_engine import assess_qr_risk, assess_email_risk

# Load environment variables
import os
load_dotenv()
backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)

print(f"DEBUG: backend_env is {backend_env}, exists: {os.path.exists(backend_env)}", flush=True)
print(f"ENV CONF: SAFE_BROWSING_API_KEY present: {bool(os.getenv('SAFE_BROWSING_API_KEY'))}", flush=True)
print(f"ENV CONF: VIRUSTOTAL_API_KEY present: {bool(os.getenv('VIRUSTOTAL_API_KEY'))}", flush=True)
print(f"ENV CONF: LLM_API_KEY present: {bool(os.getenv('LLM_API_KEY'))}", flush=True)




app = FastAPI(
    title="Fan Fraud Shield API",
    description="Backend API for ACM RVCE Code Cup 2026 - Cybersecurity Track (Team KAY)",
    version="1.0.0"
)

# CORS Setup
origins_str = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]
if not origins:
    origins = ["*"]
else:
    # Always ensure Vercel production and localhost are allowed
    for d in ["http://localhost:5173", "https://bhai-snowy.vercel.app"]:
        if d not in origins:
            origins.append(d)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Schema Models (conforming strictly to SKILL.md specs)
class CheckResponse(BaseModel):
    verdict: Literal["HIGH", "MEDIUM", "LOW"]
    score: int = Field(..., ge=0, le=100)
    reasons: List[str]
    source: Literal["qr", "email"]

class QRCheckRequest(BaseModel):
    url: str

class EmailCheckRequest(BaseModel):
    content: str

# Endpoints
@app.get("/health")
def health_check():
    """Simple backend health/liveness indicator."""
    return {"status": "healthy"}

@app.post("/api/qr/check", response_model=CheckResponse)
def check_qr(payload: QRCheckRequest):
    """
    Evaluates QR code URL destination redirects, SSL certificate status,
    domain age, and Google Safe Browsing / VirusTotal reputation.
    """
    risk_report = assess_qr_risk(payload.url)
    return risk_report

@app.post("/api/email/check", response_model=CheckResponse)
def check_email(payload: EmailCheckRequest):
    """
    Evaluates email raw content headers and body for display-name spoofing,
    typosquatting domains, urgency prefilters, and LLM scam classification.
    """
    risk_report = assess_email_risk(payload.content)
    return risk_report

from fastapi.responses import RedirectResponse

@app.get("/r1")
def redirect_1():
    """First hop: redirects to /r2"""
    return RedirectResponse(url="http://localhost:8000/r2")

@app.get("/r2")
def redirect_2():
    """Second hop: redirects to expired.badssl.com"""
    return RedirectResponse(url="https://expired.badssl.com")

