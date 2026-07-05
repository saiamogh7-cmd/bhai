import React, { useState, useEffect, useRef } from 'react';
import QRCheck from './pages/QRCheck';
import EmailCheck from './pages/EmailCheck';
import HeroHand from './components/HeroHand';
import './App.css';

// ─── Matrix Rain ──────────────────────────────────────────────────────────────
function MatrixRain({ className = '' }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 13;
    const chars = '01234567890ABCDEF';
    const drops = () => Array(Math.floor(canvas.width / fontSize)).fill(1);
    let d = drops();
    let raf;

    const draw = () => {
      ctx.fillStyle = 'rgba(3,6,5,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      d.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const alpha = 0.25 + Math.random() * 0.75;
        ctx.fillStyle = `rgba(0,255,102,${alpha})`;
        ctx.fillText(ch, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) d[i] = 0;
        d[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
}

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ icon, label, desc, badge, onClick, accentColor }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start gap-4 rounded-2xl p-8 border cursor-pointer text-left w-full transition-all duration-300
        border-slate-800 hover:border-[#00ff66]/50 bg-[#040a08]/80 hover:bg-[#040a08]
        shadow-lg hover:shadow-[0_0_40px_rgba(0,255,102,0.15)]"
    >
      {/* Corner index badge */}
      <span className="absolute top-4 right-4 text-[9px] font-mono-tech text-[#00ff66]/50 group-hover:text-[#00ff66] transition-colors">
        {badge}
      </span>

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl
        bg-[#00ff66]/8 border border-[#00ff66]/20 group-hover:border-[#00ff66]/50
        group-hover:bg-[#00ff66]/15 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,102,0.1)]
        group-hover:shadow-[0_0_30px_rgba(0,255,102,0.25)]">
        {icon}
      </div>

      {/* Text */}
      <div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ff66] transition-colors">
          {label}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>

      {/* CTA arrow */}
      <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-600 group-hover:text-[#00ff66] transition-all mt-auto">
        <span>Launch tool</span>
        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
      </div>

      {/* Bottom glow bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl bg-gradient-to-r from-transparent via-[#00ff66]/0 to-transparent group-hover:via-[#00ff66]/60 transition-all duration-500" />
    </button>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [booting, setBooting]             = useState(true);
  const [bootLogs, setBootLogs]           = useState([]);
  const [activeTab, setActiveTab]         = useState('home');
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const toolsRef = useRef(null);

  // Boot sequence
  useEffect(() => {
    if (!booting) return;
    const logs = [
      'SYSTEM INIT — TEAM KAY / ACM RVCE PS9',
      'LOADING FASTAPI RISK ENGINE v1.0.0...',
      'CONNECTING: GOOGLE SAFE BROWSING API...',
      'CONNECTING: VIRUSTOTAL v3 DOMAIN INTEL...',
      'BOOTSTRAPPING: GEMINI-1.5-FLASH CLASSIFIER...',
      'SHIELD INTEGRITY: CONFIRMED OK.',
      'ACCESS GRANTED — FAN FRAUD SHIELD ONLINE.',
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i < logs.length) { setBootLogs(p => [...p, `> ${logs[i]}`]); i++; }
      else { clearInterval(iv); setTimeout(() => setBooting(false), 280); }
    }, 170);
    return () => clearInterval(iv);
  }, [booting]);

  const handleScanComplete = (result) => setCurrentRiskScore(result ? result.score : 0);

  let globalAlertClass = '';
  if (currentRiskScore >= 60)      globalAlertClass = 'threat-pulse-high border-red-500/60 ring-2 ring-red-500/20';
  else if (currentRiskScore >= 25) globalAlertClass = 'border-amber-500/40 ring-1 ring-amber-500/10';
  else if (currentRiskScore > 0)   globalAlertClass = 'border-[#00ff66]/30';

  const goToTool = (tab) => {
    setActiveTab(tab);
    setCurrentRiskScore(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Boot screen ──
  if (booting) {
    return (
      <div className="bg-[#030605] text-slate-200 min-h-screen flex flex-col justify-center items-center p-6 relative font-mono select-none overflow-hidden">
        <div className="scanlines" />
        <MatrixRain className="opacity-20" />
        <div className="relative z-10 max-w-xl w-full border border-[#00ff66]/20 bg-[#040a08]/90 p-6 rounded-xl shadow-[0_0_40px_rgba(0,255,102,0.15)] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <span className="text-[10px] tracking-widest text-[#00ff66] font-bold uppercase font-mono-tech">
              BOOT_SEQUENCE — TEAM KAY
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-ping" />
          </div>
          <div className="h-56 overflow-y-auto text-xs text-[#00ff66]/80 leading-6 font-mono-tech select-text">
            {bootLogs.map((log, idx) => <div key={idx}>{log}</div>)}
            <div className="w-2 h-4 bg-[#00ff66] inline-block animate-pulse ml-1" />
          </div>
          <button
            onClick={() => setBooting(false)}
            className="mt-5 self-end border border-[#00ff66]/40 hover:bg-[#00ff66]/10 text-[#00ff66] font-bold tracking-widest uppercase text-[10px] py-2 px-5 rounded-full transition-all duration-200 cursor-pointer"
          >
            Skip Boot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#030605] text-slate-200 min-h-screen relative font-sans flex flex-col transition-all duration-500 ${globalAlertClass}`}>
      <div className="scanlines" />

      {/* Critical threat banner */}
      {currentRiskScore >= 60 && (
        <div className="bg-red-950/90 border-b border-red-500/50 text-red-400 font-mono-tech py-2 text-center text-xs tracking-widest uppercase select-none animate-pulse relative z-50">
          [!!!] CRITICAL THREAT SIGNATURE DETECTED — DO NOT PROCEED [!!!]
        </div>
      )}

      {/* ── Header ── */}
      <header className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-900/50 relative z-30">
        <button
          onClick={() => { setActiveTab('home'); setCurrentRiskScore(0); }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <span className="text-xl">🛡️</span>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-mono-tech text-[#00ff66] tracking-widest uppercase">Fan Fraud Shield</span>
            <span className="text-base font-cyber-panel font-extrabold tracking-wider text-white uppercase">
              Team <span className="text-[#00ff66]">KAY</span>
            </span>
          </div>
        </button>

        {/* Tool quick-links */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={() => goToTool('qr')}
            className={`text-[11px] font-mono-tech uppercase tracking-wider px-4 py-1.5 rounded-full border transition-all cursor-pointer
              ${activeTab === 'qr'
                ? 'border-[#00ff66]/60 text-[#00ff66] bg-[#00ff66]/8'
                : 'border-slate-800 text-slate-400 hover:border-[#00ff66]/30 hover:text-slate-200'}`}
          >
            📷 QR Scanner
          </button>
          <button
            onClick={() => goToTool('email')}
            className={`text-[11px] font-mono-tech uppercase tracking-wider px-4 py-1.5 rounded-full border transition-all cursor-pointer
              ${activeTab === 'email'
                ? 'border-[#00ff66]/60 text-[#00ff66] bg-[#00ff66]/8'
                : 'border-slate-800 text-slate-400 hover:border-[#00ff66]/30 hover:text-slate-200'}`}
          >
            ✉️ Email Check
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOME PAGE                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'home' && (
        <>
          {/* ── HERO: full viewport height ── */}
          <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
            {/* Matrix rain — full hero bg */}
            <MatrixRain className="opacity-30" />

            {/* Dark gradient overlay — left side readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#030605]/95 via-[#030605]/75 to-[#030605]/10 pointer-events-none z-10" />
            {/* Bottom fade into next section */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#030605] to-transparent pointer-events-none z-10" />

            <div className="relative z-20 max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* LEFT: copy */}
              <div className="md:col-span-6 flex flex-col">
                <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase mb-5 flex items-center gap-2">
                  <span className="w-4 h-px bg-[#00ff66]" />
                  Fan Fraud Shield — ACM RVCE PS9
                </span>

                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-none mb-4">
                  Detection
                  <br />
                  <span className="font-light font-serif italic text-slate-400">and</span>
                  <span className="text-[#00ff66]"> Response</span>
                </h1>

                <p className="text-base text-slate-400 max-w-md leading-relaxed mb-8">
                  Protecting World Cup 2026 fans from phishing, fake QR codes, and spoofed emails — powered by AI and real-time threat intelligence.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-[#00ff66] hover:bg-[#00e85a] text-black font-bold font-mono-tech tracking-wider uppercase text-sm px-7 py-3 rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:shadow-[0_0_40px_rgba(0,255,102,0.6)]"
                  >
                    Start Scanning ↓
                  </button>
                  <button
                    onClick={() => goToTool('email')}
                    className="border border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/10 font-mono-tech tracking-wider uppercase text-sm px-7 py-3 rounded-full transition-all duration-300 cursor-pointer"
                  >
                    Check Email
                  </button>
                </div>

                {/* Scroll hint */}
                <div className="flex items-center gap-2 mt-12 text-[10px] font-mono-tech text-slate-600 uppercase tracking-widest animate-bounce">
                  <span>↓</span> <span>Scroll to use the tools</span>
                </div>
              </div>

              {/* RIGHT: particle hand */}
              <div className="md:col-span-6 flex justify-center items-center">
                <HeroHand />
              </div>
            </div>
          </section>

          {/* ── TOOLS SECTION ── */}
          <section ref={toolsRef} className="relative max-w-7xl w-full mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-3">
                [ CHOOSE YOUR TOOL ]
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                What would you like to check?
              </h2>
              <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
                Paste your QR code image or suspicious email below — our AI engine will analyse it instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <ToolCard
                icon="📷"
                badge="[ 01 ]"
                label="QR Code Scanner"
                desc="Upload a QR code image. We trace all redirects, verify SSL certificates, and check domain reputation against VirusTotal & Google Safe Browsing."
                onClick={() => goToTool('qr')}
              />
              <ToolCard
                icon="✉️"
                badge="[ 02 ]"
                label="Email Scrutinizer"
                desc="Paste a suspicious email header or body. Our AI detects display-name spoofing, typosquatted domains, and phishing language patterns."
                onClick={() => goToTool('email')}
              />
            </div>

            {/* How it works — 3 quick steps */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { step: '01', title: 'Upload / Paste', desc: 'Drop your QR image or paste the email text' },
                { step: '02', title: 'AI Analysis',    desc: 'Gemini + VirusTotal scan in under 3 seconds' },
                { step: '03', title: 'Verdict',        desc: 'Get a clear HIGH / MEDIUM / LOW risk verdict' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center gap-3">
                  <span className="text-4xl font-cyber-panel font-black text-[#00ff66]/20 select-none">{step}</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── TECH STRIP ── */}
          <div className="border-t border-b border-slate-900/60 py-4 select-none overflow-hidden">
            <div className="flex justify-around items-center gap-6 font-mono-tech text-[10px] text-slate-700 tracking-widest uppercase">
              <span>FastAPI</span><span>•</span>
              <span>React 19</span><span>•</span>
              <span>Three.js</span><span>•</span>
              <span>Gemini 1.5 Flash</span><span>•</span>
              <span>VirusTotal</span><span>•</span>
              <span>Google Safe Browsing</span>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <footer className="max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-900">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">🛡️</span>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-mono-tech text-[#00ff66] tracking-widest uppercase">Fan Fraud Shield</span>
                  <span className="text-base font-cyber-panel font-extrabold text-white uppercase">
                    Team <span className="text-[#00ff66]">KAY</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono-tech leading-5 uppercase max-w-xs">
                Protecting fans from digital scams during FIFA World Cup 2026.
              </p>
              <p className="text-[10px] text-slate-700 font-mono-tech uppercase mt-6">
                © 2026 Team KAY — ACM RVCE PS9
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-4">[ Tools ]</span>
              <ul className="space-y-2 text-xs font-mono-tech text-slate-500">
                <li><button onClick={() => goToTool('qr')}    className="hover:text-white transition-colors cursor-pointer">QR Code Scanner</button></li>
                <li><button onClick={() => goToTool('email')} className="hover:text-white transition-colors cursor-pointer">Email Scrutinizer</button></li>
              </ul>
            </div>
            <div>
              <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-4">[ Team ]</span>
              <ul className="space-y-1 text-xs font-mono-tech text-slate-500">
                <li>ACM RVCE — PS9</li>
                <li>Team KAY</li>
              </ul>
            </div>
          </footer>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* QR SCANNER                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'qr' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-28">
          <div className="pt-6 pb-2 flex items-center gap-3">
            <button
              onClick={() => { setActiveTab('home'); setCurrentRiskScore(0); }}
              className="text-[10px] font-mono-tech text-slate-500 hover:text-[#00ff66] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            >
              ← Home
            </button>
            <span className="text-slate-800">/</span>
            <span className="text-[10px] font-mono-tech text-[#00ff66] uppercase tracking-wider">QR Scanner</span>
          </div>
          <QRCheck onScanComplete={handleScanComplete} />
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* EMAIL SCRUTINIZER                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'email' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-28">
          <div className="pt-6 pb-2 flex items-center gap-3">
            <button
              onClick={() => { setActiveTab('home'); setCurrentRiskScore(0); }}
              className="text-[10px] font-mono-tech text-slate-500 hover:text-[#00ff66] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            >
              ← Home
            </button>
            <span className="text-slate-800">/</span>
            <span className="text-[10px] font-mono-tech text-[#00ff66] uppercase tracking-wider">Email Scrutinizer</span>
          </div>
          <EmailCheck onScanComplete={handleScanComplete} />
        </main>
      )}

      {/* ── Bottom capsule nav ── */}
      <nav className="bottom-nav-capsule">
        <button
          onClick={() => { setActiveTab('home'); setCurrentRiskScore(0); }}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >• Home</button>

        <span className="text-slate-800 select-none">|</span>

        <button
          onClick={() => goToTool('qr')}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'qr' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >📷 Resolver</button>

        <span className="text-slate-800 select-none">|</span>

        <button
          onClick={() => goToTool('email')}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'email' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >✉️ Scrutinizer</button>
      </nav>
    </div>
  );
}
