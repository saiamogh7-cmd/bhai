# Fan Fraud Shield 🛡️

### Problem Statement
A real-time command center built for World Cup 2026 fans to detect ticket phishing, redirect scams, credential spoofing, and malicious communications targeting soccer fans.

---

## 🚀 Deployed Architecture Specs

### 1. Render Deploy Settings (Backend API)
* **Service Type**: Web Service
* **Build Command**: `pip install -r backend/requirements.txt`
* **Start Command**: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables**:
  * `SAFE_BROWSING_API_KEY` (Google Safe Browsing lookup)
  * `VIRUSTOTAL_API_KEY` (VirusTotal v3 Domain lookup)
  * `LLM_API_KEY` (Gemini API access)
  * `ALLOWED_ORIGINS` (Vercel Frontend URL)

### 2. Vercel Deploy Settings (Vite Frontend)
* **Framework Preset**: Vite
* **Root Directory**: `frontend`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variables**:
  * `VITE_API_BASE_URL` (Points to the deployed Render Web Service domain)

---

## 📦 Tech Stack
* **Backend**: FastAPI, Uvicorn, Python 3.10+
* **Frontend**: React 19, Vite, Tailwind CSS, Three.js (raw Canvas engine)
* **APIs & Data**: Google Safe Browsing API, VirusTotal v3 API, Gemini 1.5 Flash API

---

## 🛠️ Core Modules

### 📷 1. QR Code Threat Resolver
* Decodes QR code matrices directly inside the browser using client-side `jsQR`.
* Tracks the full HTTP hop redirection sequence to find the final target URL.
* Inspects domain age (WHOIS) and verifies cryptographic SSL handshake status.
* Queries reputation registers (Google Safe Browsing & VirusTotal) to score threat probability.

### ✉️ 2. Email Spoofing Scrutinizer
* Parses raw pasted email header structures to match display name deviations.
* Computes typosquat Levenshtein distances against known sponsor domains (e.g. `fifa.com`).
* Runs rule-based regex pre-filters looking for urgent or reply-to-claim keywords.
* Leverages Gemini 1.5 Flash to classify zero-payload social engineering patterns.

---

## 🔑 Required API Keys & Secret Setup

Create a `.env` file under `backend/.env`:

```env
# Google Safe Browsing API Key (v4 API)
# Get from Google Cloud Console -> Enable Safe Browsing API -> Create API Key
SAFE_BROWSING_API_KEY=your_google_safe_browsing_key

# VirusTotal API Key
# Sign up at virustotal.com -> Profile -> API Key
VIRUSTOTAL_API_KEY=your_virustotal_api_key

# Gemini API Key
# Sign in at aistudio.google.com -> Click "Get API Key"
LLM_API_KEY=your_gemini_api_key

# CORS configuration (optional, defaults to "*" if blank)
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

---

## 💻 Local Quickstart

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
API launches at `http://localhost:8000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard launches at `http://localhost:5173`.

---

## ⚠️ Known Limitations
* **Zero-Shot LLM Classifier**: The email content "reply-to-claim" detector leverages Gemini 1.5 Flash utilizing zero-shot prompts with embedded examples. It is not an offline-trained custom model since no dedicated hackathon-specific datasets exist yet.
* **WHOIS Connection Blocks**: WHOIS lookups utilize a raw socket check which can occasionally be blocked or delayed by local antivirus firewalls (e.g., Kaspersky) or registry rate limits.

---

## 👥 Credits
Developed by **Team KAY** for the **ACM RVCE Code Cup 2026 - Cybersecurity Track**.
