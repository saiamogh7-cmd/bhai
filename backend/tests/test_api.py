"""
Integration tests for the FastAPI endpoints using TestClient (httpx).
No real external API calls are made — external services are mocked.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Set dummy env vars BEFORE importing the app to satisfy settings validators
os.environ.setdefault("SAFE_BROWSING_API_KEY", "test-key")
os.environ.setdefault("VIRUSTOTAL_API_KEY", "test-key")
os.environ.setdefault("LLM_API_KEY", "test-key")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ──────────────────────────────────────────────────────────────────────────────
# Health endpoint
# ──────────────────────────────────────────────────────────────────────────────
class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_correct_body(self):
        response = client.get("/health")
        data = response.json()
        assert data == {"status": "healthy"}


# ──────────────────────────────────────────────────────────────────────────────
# QR Check endpoint
# ──────────────────────────────────────────────────────────────────────────────
class TestQRCheckEndpoint:
    def _mock_clean(self):
        return [
            patch("app.risk_engine.follow_redirects", return_value=(["https://example.com"], "https://example.com")),
            patch("app.risk_engine.check_reputation", return_value=(False, [])),
            patch("app.risk_engine.check_ssl", return_value=("valid", "OK")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),
        ]

    def test_qr_check_success(self):
        patches = self._mock_clean()
        with patches[0], patches[1], patches[2], patches[3]:
            response = client.post("/api/qr/check", json={"url": "https://example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "qr"
        assert data["verdict"] in ("LOW", "MEDIUM", "HIGH")
        assert isinstance(data["score"], int)
        assert 0 <= data["score"] <= 100
        assert isinstance(data["reasons"], list)

    def test_qr_check_missing_url_returns_422(self):
        response = client.post("/api/qr/check", json={})
        assert response.status_code == 422

    def test_qr_check_high_risk_url(self):
        with (
            patch("app.risk_engine.follow_redirects", return_value=(["https://evil.com"], "https://evil.com")),
            patch("app.risk_engine.check_reputation", return_value=(True, ["MALWARE detected."])),
            patch("app.risk_engine.check_ssl", return_value=("expired", "Expired")),
            patch("app.risk_engine.get_domain_age_days", return_value=5),
        ):
            response = client.post("/api/qr/check", json={"url": "https://evil.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] == "HIGH"

    def test_qr_check_response_schema_complete(self):
        """Verify all required fields exist in the response."""
        patches = self._mock_clean()
        with patches[0], patches[1], patches[2], patches[3]:
            response = client.post("/api/qr/check", json={"url": "https://example.com"})
        data = response.json()
        assert "verdict" in data
        assert "score" in data
        assert "reasons" in data
        assert "source" in data
        assert data["verdict"] in ("LOW", "MEDIUM", "HIGH")


# ──────────────────────────────────────────────────────────────────────────────
# Email Check endpoint
# ──────────────────────────────────────────────────────────────────────────────
class TestEmailCheckEndpoint:
    CLEAN_EMAIL = (
        "From: noreply@fifa.com\n"
        "Subject: Booking Confirmation\n"
        "\n"
        "Your tickets are confirmed. Booking ref: XYZ123.\n"
    )

    SCAM_EMAIL = (
        'From: "FIFA Ticketing" <claim@fakefifa-support.net>\n'
        "Reply-To: scammer@evil.ru\n"
        "Subject: URGENT: Claim Your Ticket Refund Now\n"
        "\n"
        "Congratulations! Reply back to claim your ticket refund immediately.\n"
    )

    def test_email_check_success(self):
        with patch("app.risk_engine.classify_email_llm", return_value={"is_scam_pattern": False, "confidence": 0, "reasoning": ""}):
            response = client.post("/api/email/check", json={"content": self.CLEAN_EMAIL})
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "email"
        assert data["verdict"] in ("LOW", "MEDIUM", "HIGH")
        assert 0 <= data["score"] <= 100

    def test_email_check_missing_content_returns_422(self):
        response = client.post("/api/email/check", json={})
        assert response.status_code == 422

    def test_email_check_scam_detected(self):
        with patch("app.risk_engine.classify_email_llm", return_value={
            "is_scam_pattern": True, "confidence": 88, "reasoning": "Reply-to-claim pattern."
        }):
            response = client.post("/api/email/check", json={"content": self.SCAM_EMAIL})
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] in ("MEDIUM", "HIGH")
        assert data["score"] >= 25

    def test_email_check_response_schema_complete(self):
        """Verify all required fields in response."""
        with patch("app.risk_engine.classify_email_llm", return_value={"is_scam_pattern": False, "confidence": 0, "reasoning": ""}):
            response = client.post("/api/email/check", json={"content": self.CLEAN_EMAIL})
        data = response.json()
        for field in ("verdict", "score", "reasons", "source"):
            assert field in data


# ──────────────────────────────────────────────────────────────────────────────
# CORS headers
# ──────────────────────────────────────────────────────────────────────────────
class TestCORS:
    def test_cors_headers_present_on_options(self):
        """OPTIONS preflight should return CORS allow headers."""
        response = client.options(
            "/api/qr/check",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        # FastAPI with CORSMiddleware returns 200 for preflight
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
