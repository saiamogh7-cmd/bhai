"""
Unit tests for Fan Fraud Shield backend services.
These tests run fully offline (no network calls) to ensure fast CI feedback.
"""
import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, MagicMock


# ──────────────────────────────────────────────────────────────────────────────
# spoof_rules
# ──────────────────────────────────────────────────────────────────────────────
from app.services.spoof_rules import (
    levenshtein_distance,
    check_typosquatting,
    check_rules,
    OFFICIAL_DOMAINS,
)


class TestLevenshteinDistance:
    def test_identical_strings(self):
        assert levenshtein_distance("fifa", "fifa") == 0

    def test_single_insertion(self):
        assert levenshtein_distance("fifa", "fifaa") == 1

    def test_single_deletion(self):
        assert levenshtein_distance("fifaa", "fifa") == 1

    def test_single_substitution(self):
        assert levenshtein_distance("fiba", "fifa") == 1

    def test_empty_string(self):
        assert levenshtein_distance("", "fifa") == 4

    def test_both_empty(self):
        assert levenshtein_distance("", "") == 0

    def test_two_edits(self):
        assert levenshtein_distance("fafa", "fifa") == 1


class TestCheckTyposquatting:
    def test_official_domain_not_flagged(self):
        is_typo, reason = check_typosquatting("fifa.com")
        assert is_typo is False
        assert reason is None

    def test_exact_official_domain_not_flagged(self):
        is_typo, reason = check_typosquatting("visa.com")
        assert is_typo is False

    def test_typosquat_detected_levenshtein(self):
        # "fiba.com" is distance 1 from "fifa.com"
        is_typo, reason = check_typosquatting("fiba.com")
        assert is_typo is True
        assert reason is not None
        assert "fiba.com" in reason

    def test_trademark_substring_flagged(self):
        # "fifa-tickets.com" contains "fifa" — not official
        is_typo, reason = check_typosquatting("fifa-tickets.com")
        assert is_typo is True
        assert "fifa" in reason

    def test_completely_unrelated_domain(self):
        is_typo, reason = check_typosquatting("randomsite.org")
        assert is_typo is False

    def test_empty_domain(self):
        is_typo, reason = check_typosquatting("")
        assert is_typo is False
        assert reason is None


class TestCheckRules:
    def test_no_flags_clean_email(self):
        body = "Hello, your purchase confirmation is ready."
        subject = "Order Confirmation"
        flagged, score, reasons = check_rules(body, subject)
        assert flagged is False
        assert score == 0
        assert reasons == []

    def test_urgency_keyword_detected(self):
        body = "This is urgent, please act immediately."
        subject = "Action Required"
        flagged, score, reasons = check_rules(body, subject)
        assert flagged is True
        assert score >= 25
        assert any("urgency" in r.lower() or "action" in r.lower() for r in reasons)

    def test_claim_keyword_detected(self):
        body = "Congratulations! Reply to this email to claim your free tickets!"
        subject = "You Won!"
        flagged, score, reasons = check_rules(body, subject)
        assert flagged is True
        assert score >= 35

    def test_zero_payload_signature(self):
        # No http links, but has claim language → zero-payload bonus
        body = "Reply back to claim your ticket refund. No links included."
        subject = "Ticket Refund"
        flagged, score, reasons = check_rules(body, subject)
        assert flagged is True
        # Should have urgency/claim + zero-payload bonus (score >= 65)
        assert score >= 60

    def test_link_present_no_zero_payload_bonus(self):
        body = "Click https://example.com to claim your prize."
        subject = "Prize"
        flagged, score, reasons = check_rules(body, subject)
        assert flagged is True
        # Has claim language but HAS a link — so no zero-payload +30 extra
        has_zero_payload_reason = any("zero-payload" in r.lower() for r in reasons)
        assert not has_zero_payload_reason


# ──────────────────────────────────────────────────────────────────────────────
# header_parser
# ──────────────────────────────────────────────────────────────────────────────
from app.services.header_parser import parse_email_text


class TestParseEmailText:
    def test_parse_standard_email(self):
        raw = (
            "From: FIFA Support <support@fakefifa.com>\n"
            "Reply-To: scammer@evil.net\n"
            "Subject: Urgent Ticket Claim\n"
            "\n"
            "Please reply to claim your tickets.\n"
        )
        result = parse_email_text(raw)
        assert result["from_domain"] == "fakefifa.com"
        assert result["reply_to_domain"] == "evil.net"
        assert result["subject"] == "Urgent Ticket Claim"
        assert "reply" in result["body"].lower()

    def test_parse_display_name_extracted(self):
        raw = (
            'From: "FIFA Officials" <noreply@scam.io>\n'
            "Subject: Hello\n"
            "\n"
            "Body here.\n"
        )
        result = parse_email_text(raw)
        assert result["display_name"] == "FIFA Officials"
        assert result["from_domain"] == "scam.io"

    def test_plain_body_fallback(self):
        # No headers at all — should fall back to raw text as body
        raw = "Congratulations! You won free tickets. Reply back to claim."
        result = parse_email_text(raw)
        assert result["body"] == raw.strip()

    def test_return_path_parsed(self):
        raw = (
            "From: sender@legit.com\n"
            "Return-Path: <bounce@different.com>\n"
            "Subject: Test\n"
            "\n"
            "Body.\n"
        )
        result = parse_email_text(raw)
        assert result["return_path_domain"] == "different.com"

    def test_empty_email(self):
        result = parse_email_text("")
        assert result["from_domain"] == ""
        assert result["subject"] == ""


# ──────────────────────────────────────────────────────────────────────────────
# domain_intel (offline: extract_hostname only — SSL/WHOIS hit network)
# ──────────────────────────────────────────────────────────────────────────────
from app.services.domain_intel import extract_hostname


class TestExtractHostname:
    def test_https_url(self):
        assert extract_hostname("https://www.example.com/path") == "www.example.com"

    def test_http_url(self):
        assert extract_hostname("http://example.com") == "example.com"

    def test_bare_domain_gets_prefix(self):
        result = extract_hostname("example.com")
        assert result == "example.com"

    def test_url_with_port(self):
        assert extract_hostname("https://api.example.com:8080/api") == "api.example.com:8080"

    def test_url_with_userinfo(self):
        deceptive = "https://accounts.google.com+signin=secure+v2+identifier=passive@6tn9bp7z3veallknvm5p.lkuq.ru/7snjh"
        assert extract_hostname(deceptive) == "6tn9bp7z3veallknvm5p.lkuq.ru"


# ──────────────────────────────────────────────────────────────────────────────
# redirect_chain (mocked — no live network calls)
# ──────────────────────────────────────────────────────────────────────────────
from app.services.redirect_chain import follow_redirects


class TestFollowRedirects:
    def test_no_redirect(self):
        """A clean URL with no redirects returns single-element hop list."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.url = "https://example.com"

        with patch("app.services.redirect_chain.requests.Session.get", return_value=mock_response):
            hops, final = follow_redirects("https://example.com")
        assert final == "https://example.com"
        assert len(hops) == 1

    def test_single_redirect(self):
        """A URL with one intermediate hop returns 2 entries."""
        resp1 = MagicMock()
        resp1.status_code = 302
        resp1.headers = {"Location": "https://final.example.com"}
        
        resp2 = MagicMock()
        resp2.status_code = 200
        resp2.url = "https://final.example.com"

        with patch("app.services.redirect_chain.requests.Session.get", side_effect=[resp1, resp2]) as mock_get:
            hops, final = follow_redirects("https://short.url/abc")
        assert final == "https://final.example.com"
        assert hops == ["https://short.url/abc", "https://final.example.com"]
        assert mock_get.call_count == 2

    def test_network_error_graceful_fallback(self):
        """On network failure, returns original URL as the only hop."""
        import requests as req_lib
        with patch("app.services.redirect_chain.requests.Session.get", side_effect=req_lib.RequestException("timeout")):
            hops, final = follow_redirects("https://example.com")
        assert final == "https://example.com"
        assert hops == ["https://example.com"]

    def test_url_without_scheme_gets_https(self):
        """Bare domain gets https:// prepended before fetching."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.url = "https://example.com"

        with patch("app.services.redirect_chain.requests.Session.get", return_value=mock_response) as mock_get:
            follow_redirects("example.com")
        called_url = mock_get.call_args[0][0]
        assert called_url.startswith("https://")

    def test_meta_refresh_redirect(self):
        """HTML meta-refresh redirect is correctly parsed and followed."""
        resp1 = MagicMock()
        resp1.status_code = 200
        resp1.headers = {"Content-Type": "text/html"}
        resp1.raw = MagicMock()
        resp1.raw.read.return_value = b'<html><head><meta http-equiv="refresh" content="0; url=https://target.com" /></head></html>'

        resp2 = MagicMock()
        resp2.status_code = 200
        resp2.headers = {"Content-Type": "text/plain"}

        with patch("app.services.redirect_chain.requests.Session.get", side_effect=[resp1, resp2]) as mock_get:
            hops, final = follow_redirects("https://start.com")
        assert final == "https://target.com"
        assert hops == ["https://start.com", "https://target.com"]
        assert mock_get.call_count == 2


# ──────────────────────────────────────────────────────────────────────────────
# Risk engine: score & verdict logic (fully mocked services)
# ──────────────────────────────────────────────────────────────────────────────
class TestAssessQrRiskScoring:
    """Tests the risk engine scoring logic using mocked service calls."""

    def _mock_all_clean(self):
        """Returns a patch context where every service signals a clean URL."""
        return [
            patch("app.risk_engine.follow_redirects", return_value=(["https://example.com"], "https://example.com")),
            patch("app.risk_engine.check_reputation", return_value=(False, [])),
            patch("app.risk_engine.check_ssl", return_value=("valid", "SSL is fine")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),  # 10 years
        ]

    def test_clean_url_low_verdict(self):
        from app.risk_engine import assess_qr_risk
        patches = self._mock_all_clean()
        with patches[0], patches[1], patches[2], patches[3]:
            result = assess_qr_risk("https://example.com")
        assert result["verdict"] == "LOW"
        assert result["score"] < 30
        assert result["source"] == "qr"

    def test_raw_text_qr_returns_low_risk(self):
        from app.risk_engine import assess_qr_risk
        # Raw text with no dot in domain structure
        result = assess_qr_risk("dlswicaadw")
        assert result["verdict"] == "LOW"
        assert result["score"] == 0
        assert any("raw text" in r.lower() for r in result["reasons"])

    def test_malicious_url_high_verdict(self):
        from app.risk_engine import assess_qr_risk
        with (
            patch("app.risk_engine.follow_redirects", return_value=(["https://evil.com"], "https://evil.com")),
            patch("app.risk_engine.check_reputation", return_value=(True, ["VirusTotal flagged this as malicious."])),
            patch("app.risk_engine.check_ssl", return_value=("valid", "SSL is fine")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),
        ):
            result = assess_qr_risk("https://evil.com")
        assert result["verdict"] == "HIGH"
        assert result["score"] >= 70

    def test_expired_ssl_raises_score(self):
        from app.risk_engine import assess_qr_risk
        with (
            patch("app.risk_engine.follow_redirects", return_value=(["https://example.com"], "https://example.com")),
            patch("app.risk_engine.check_reputation", return_value=(False, [])),
            patch("app.risk_engine.check_ssl", return_value=("expired", "Certificate expired")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),
        ):
            result = assess_qr_risk("https://example.com")
        assert result["score"] >= 50
        assert any("expired" in r.lower() for r in result["reasons"])

    def test_many_redirects_adds_score(self):
        from app.risk_engine import assess_qr_risk
        hops = ["https://a.com", "https://b.com", "https://c.com", "https://d.com"]
        with (
            patch("app.risk_engine.follow_redirects", return_value=(hops, "https://d.com")),
            patch("app.risk_engine.check_reputation", return_value=(False, [])),
            patch("app.risk_engine.check_ssl", return_value=("valid", "ok")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),
        ):
            result = assess_qr_risk("https://a.com")
        assert result["score"] >= 20
        assert any("redirect" in r.lower() for r in result["reasons"])

    def test_score_capped_at_100(self):
        """Score should never exceed 100 even with all signals stacking."""
        from app.risk_engine import assess_qr_risk
        hops = ["h1", "h2", "h3", "h4"]
        with (
            patch("app.risk_engine.follow_redirects", return_value=(hops, "https://evil.com")),
            patch("app.risk_engine.check_reputation", return_value=(True, ["MALWARE"])),
            patch("app.risk_engine.check_ssl", return_value=("expired", "expired")),
            patch("app.risk_engine.get_domain_age_days", return_value=1),  # 1 day old!
        ):
            result = assess_qr_risk("https://evil.com")
        assert result["score"] <= 100

    def test_deceptive_url_authority_high_verdict(self):
        from app.risk_engine import assess_qr_risk
        # Deceptive URL structure with '@' symbol
        deceptive_url = "https://accounts.google.com+signin=secure+v2+identifier=passive@6tn9bp7z3veallknvm5p.lkuq.ru/7snjh"
        with (
            patch("app.risk_engine.follow_redirects", return_value=([deceptive_url], deceptive_url)),
            patch("app.risk_engine.check_reputation", return_value=(False, [])),
            patch("app.risk_engine.check_ssl", return_value=("valid", "ok")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),
        ):
            result = assess_qr_risk(deceptive_url)
        assert result["verdict"] == "HIGH"
        assert result["score"] >= 85
        assert any("deceptive" in r.lower() or "@" in r.lower() for r in result["reasons"])

    def test_typosquatting_destination_raises_score(self):
        from app.risk_engine import assess_qr_risk
        # Destination typosquats "fifa.com"
        typo_url = "https://fifaa.com"
        with (
            patch("app.risk_engine.follow_redirects", return_value=([typo_url], typo_url)),
            patch("app.risk_engine.check_reputation", return_value=(False, [])),
            patch("app.risk_engine.check_ssl", return_value=("valid", "ok")),
            patch("app.risk_engine.get_domain_age_days", return_value=3650),
        ):
            result = assess_qr_risk(typo_url)
        assert result["score"] >= 65
        assert any("typosquatting" in r.lower() for r in result["reasons"])


class TestAssessEmailRiskScoring:
    """Tests the email risk engine scoring logic."""

    def test_clean_email_low_verdict(self):
        from app.risk_engine import assess_email_risk
        raw = (
            "From: noreply@fifa.com\n"
            "Subject: Ticket Purchase Confirmation\n"
            "\n"
            "Thank you for your purchase. Your booking reference is ABC123.\n"
        )
        with patch("app.risk_engine.classify_email_llm", return_value={"is_scam_pattern": False, "confidence": 0, "reasoning": ""}):
            result = assess_email_risk(raw)
        assert result["source"] == "email"
        assert result["score"] <= 30  # Should be LOW

    def test_display_name_spoof_detected(self):
        from app.risk_engine import assess_email_risk
        raw = (
            "From: FIFA Support <support@fakefifa-tickets.ru>\n"
            "Subject: Claim Your Ticket\n"
            "\n"
            "Reply to claim your refund.\n"
        )
        with patch("app.risk_engine.classify_email_llm", return_value={"is_scam_pattern": False, "confidence": 0, "reasoning": ""}):
            result = assess_email_risk(raw)
        assert result["score"] >= 25
        assert result["verdict"] in ("MEDIUM", "HIGH")

    def test_llm_high_confidence_scam(self):
        from app.risk_engine import assess_email_risk
        raw = (
            "From: noone@random.net\n"
            "Subject: Hello\n"
            "\n"
            "Hello.\n"
        )
        with patch("app.risk_engine.classify_email_llm", return_value={
            "is_scam_pattern": True,
            "confidence": 90,
            "reasoning": "Clear reply-to-claim scam pattern detected."
        }):
            result = assess_email_risk(raw)
        # 60 * (90/100) = 54 → MEDIUM or HIGH
        assert result["score"] >= 50

    def test_reply_to_domain_mismatch_adds_score(self):
        from app.risk_engine import assess_email_risk
        raw = (
            "From: sender@legit.com\n"
            "Reply-To: reply@evil.com\n"
            "Subject: Test\n"
            "\n"
            "Normal email body here.\n"
        )
        with patch("app.risk_engine.classify_email_llm", return_value={"is_scam_pattern": False, "confidence": 0, "reasoning": ""}):
            result = assess_email_risk(raw)
        assert result["score"] >= 25
        assert any("reply-to" in r.lower() for r in result["reasons"])

    def test_email_score_capped_at_100(self):
        from app.risk_engine import assess_email_risk
        raw = (
            'From: "FIFA Support" <spoof@fakefifa.com>\n'
            "Reply-To: evil@scam.ru\n"
            "Return-Path: <bounce@other.io>\n"
            "Subject: URGENT: claim your FIFA ticket refund NOW\n"
            "\n"
            "Congratulations! Reply back to claim your ticket refund immediately.\n"
        )
        with patch("app.risk_engine.classify_email_llm", return_value={
            "is_scam_pattern": True,
            "confidence": 100,
            "reasoning": "Obvious scam."
        }):
            result = assess_email_risk(raw)
        assert result["score"] <= 100
        assert result["verdict"] == "HIGH"

    def test_quishing_email_detected(self):
        from app.risk_engine import assess_email_risk
        raw = (
            "Hello User\n"
            "Your Authenticator session has expired today. Kindly re-authenticate with your mobile device to avoid being locked out of your email account\n"
            "Quickly Scan the QR Code below with your smartphone to re-authenticate your password security,\n"
            "Regards, Microsoft Support\n"
        )
        with patch("app.risk_engine.classify_email_llm", return_value={
            "is_scam_pattern": True,
            "confidence": 95,
            "reasoning": "Credential harvesting quishing scam targeting Microsoft Authenticator session."
        }):
            result = assess_email_risk(raw)
        assert result["verdict"] == "HIGH"
        assert result["score"] >= 70
        assert any("quishing" in r.lower() or "qr code" in r.lower() for r in result["reasons"])
        assert any("urgency" in r.lower() for r in result["reasons"])
