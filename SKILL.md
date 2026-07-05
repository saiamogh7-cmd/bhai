---
name: fan-fraud-shield
description: Provides full project context for the Fan Fraud Shield hackathon build — the problem statement, the two detection modules, the shared API schema, tech stack, folder structure, and hard rules. Use whenever building, extending, testing, styling, or deploying any part of the Fan Fraud Shield QR-code scam checker or email spoofing/scam checker, including backend endpoints, the risk engine, frontend pages, or deployment configuration.
---

# Fan Fraud Shield — Project Skill

## What this project is
A cybersecurity hackathon submission (ACM RVCE, CODE CUP 2026, Cybersecurity Track,
Open Problem Statement PS9) built by Team KAY. It detects World Cup 2026 fan scams
that live outside a website — the exact gap left open by domain-checker-style tools
(WHOIS/SSL/visual-similarity/OSINT), which only ever inspect a link inside a page.

Two scam vectors, two modules:

1. **QR Module** — a fan scans a parking/shuttle/fan-zone QR code. The app decodes
   it, follows the FULL redirect chain (not just the first hop), then checks WHOIS
   domain age, SSL certificate validity, and reputation (Google Safe Browsing +
   VirusTotal) on the final destination.
2. **Email Module** — a fan pastes a suspicious message. The app checks for
   **display-name spoofing** (e.g. "FIFA Official Ticketing" from a domain that has
   nothing to do with FIFA) and **zero-payload "reply-to-claim" scams** (no link or
   attachment, so nothing for a traditional scanner to flag), using a zero-shot LLM
   classifier plus a deterministic rule-based prefilter.

Both modules feed a Unified Risk Engine that returns one explainable verdict.

## When to use this skill
- Any time you're writing or editing backend code in this repo (FastAPI routes,
  services, the risk engine)
- Any time you're writing or editing frontend code (React pages, components, styling)
- Any time you're setting up deployment config, environment variables, or the README
- Any time a prompt mentions "Fan Fraud Shield," "QR module," "email module," "risk
  engine," "verdict," or "Team KAY"

## Shared API schema — every endpoint returns exactly this
```json
{
  "verdict": "HIGH" | "MEDIUM" | "LOW",
  "score": 0-100,
  "reasons": ["string", "..."],
  "source": "qr" | "email"
}
```
Do not let the two modules drift into different response shapes. This is the
"unified" part of the Unified Risk Engine.

## Tech stack
- Backend: Python, FastAPI, uvicorn
- Frontend: React (Vite), Tailwind CSS
- QR decode: client-side via **jsQR** — never pyzbar, it needs a system-level
  library (libzbar) that complicates deployment
- Domain intel: python-whois, Python ssl/socket for certificate checks
- Reputation: Google Safe Browsing API, VirusTotal API — cache every lookup result
  in-memory, keyed by domain/URL, since VirusTotal's free tier is rate-limited
- Email classification: an LLM API call using zero-shot / few-shot prompting —
  this is deliberate, not a shortcut. There is no existing labeled dataset for
  World-Cup-specific scam emails, so a custom-trained classifier was ruled out in
  favor of prompting a general model with the pattern definition and a few examples
  embedded directly in the prompt
- Target deployment: backend on Render, frontend on Vercel

## Folder structure
```
backend/app/{main.py, routers/, services/, risk_engine.py, cache.py}
frontend/src/{pages/, components/, api/}
```

## Hard rules — never violate these
1. **Never hardcode or commit an API key or secret.** All secrets are read from
   environment variables. `.env.example` (committed, empty values) documents what's
   needed; `.env` (gitignored) holds the real values.
2. **If a task needs a real API key you don't have** (Safe Browsing, VirusTotal, an
   LLM provider), **stop and ask the user to paste it into the relevant `.env`
   file** rather than inventing a placeholder and continuing as if it works.
3. **Every external API call** (WHOIS, SSL, Safe Browsing, VirusTotal, the LLM
   classifier) is wrapped in a try/except with a timeout, and degrades to a clear
   "check unavailable" state in the response rather than crashing or hanging.
4. **Every endpoint returns the shared schema above.** No custom shapes per module.
5. **Commit incrementally** after each working milestone, not as one giant diff.

## Known limitations to preserve (don't silently "fix" these)
- The reply-to-claim detector is intentionally zero-shot LLM classification, not a
  trained model. Don't replace it with a trained classifier unless explicitly
  asked — there's no dataset for it in this timeframe.
- Test cases are drawn from public, safe test infrastructure (Google's Safe
  Browsing test URL, badssl.com) rather than real scam domains — this is by
  design, not a gap.
