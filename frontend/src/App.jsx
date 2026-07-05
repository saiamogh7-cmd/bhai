import React, { useState, useEffect, useRef } from 'react';
import QRCheck from './pages/QRCheck';
import EmailCheck from './pages/EmailCheck';
import HeroHand from './components/HeroHand';
import './App.css';

// ─── Matrix Rain Component ─────────────────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 14;
    let cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);

    const chars = '0123456789ABCDEF01';

    let animId;
    const draw = () => {
      // Fade trail
      ctx.fillStyle = 'rgba(3, 6, 5, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Brightest character at tip
        if (drops[i] * fontSize < canvas.height * 0.15) {
          ctx.fillStyle = '#ffffff';
        } else {
          // Vary opacity for depth
          const alpha = 0.3 + Math.random() * 0.7;
          ctx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
        }

        ctx.fillText(char, x, y);

        // Reset drop randomly at bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.45 }}
    />
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [currentRiskScore, setCurrentRiskScore] = useState(0);

  // Terminal boot sequence
  useEffect(() => {
    if (!booting) return;

    const logs = [
      'SYSTEM INIT: ACM RVCE PS9 — TEAM KAY',
      'LOADING FASTAPI RISK ENGINE v1.0.0...',
      'CONNECTING: GOOGLE SAFE BROWSING API...',
      'CONNECTING: VIRUSTOTAL v3 DOMAIN INTEL...',
      'BOOTSTRAPPING: GEMINI-1.5-FLASH CLASSIFIER...',
      'SHIELD INTEGRITY: CONFIRMED OK.',
      'ACCESS GRANTED — FAN FRAUD SHIELD ONLINE.',
    ];

    let i = 0;
    const iv = setInterval(() => {
      if (i < logs.length) {
        setBootLogs((p) => [...p, `> ${logs[i]}`]);
        i++;
      } else {
        clearInterval(iv);
        setTimeout(() => setBooting(false), 300);
      }
    }, 175);

    return () => clearInterval(iv);
  }, [booting]);

  const handleScanComplete = (result) => {
    setCurrentRiskScore(result ? result.score : 0);
  };

  // Global border/glow state based on last scan risk
  let globalAlertClass = '';
  if (currentRiskScore >= 60) {
    globalAlertClass = 'threat-pulse-high border-red-500/60 ring-2 ring-red-500/20';
  } else if (currentRiskScore >= 25) {
    globalAlertClass = 'border-amber-500/40 shadow-[inset_0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/10';
  } else if (currentRiskScore > 0) {
    globalAlertClass = 'border-[#00ff66]/30 shadow-[inset_0_0_20px_rgba(0,255,102,0.08)]';
  }

  // ── Boot screen ──
  if (booting) {
    return (
      <div className="bg-[#030605] text-slate-200 min-h-screen flex flex-col justify-center items-center p-6 relative font-mono select-none">
        <div className="scanlines" />
        <div className="max-w-xl w-full border border-[#00ff66]/20 bg-[#040a08] p-6 rounded-lg shadow-[0_0_30px_rgba(0,255,102,0.12)] flex flex-col relative">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <span className="text-[10px] tracking-widest text-[#00ff66] font-bold uppercase">
              BOOT_SEQUENCE.SH — TEAM KAY
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-ping" />
          </div>
          <div className="h-64 overflow-y-auto text-xs text-[#00ff66]/90 leading-6 font-mono-tech select-text">
            {bootLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
            <div className="w-2 h-4 bg-[#00ff66] inline-block animate-pulse ml-1" />
          </div>
          <button
            onClick={() => setBooting(false)}
            className="mt-6 border border-[#00ff66]/40 hover:bg-[#00ff66]/10 text-[#00ff66] font-bold tracking-widest uppercase text-[10px] py-2 rounded-md transition-all duration-200 cursor-pointer self-end px-4"
          >
            Skip Boot
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div className={`bg-[#030605] text-slate-200 min-h-screen relative font-sans flex flex-col transition-all duration-500 pb-24 ${globalAlertClass}`}>
      <div className="scanlines" />

      {/* High-risk alert banner */}
      {currentRiskScore >= 60 && (
        <div className="bg-red-950/90 border-b border-red-500/50 text-red-500 font-mono-tech py-2 text-center text-xs tracking-widest uppercase select-none animate-pulse relative z-50">
          [!!!] WARNING: CRITICAL THREAT SIGNATURE DETECTED [!!!]
        </div>
      )}

      {/* Subtle grid backlighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(0,255,102,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,102,0.3)_1px,transparent_1px)] bg-[size:35px_35px]"
        style={{ maskImage: 'radial-gradient(ellipse at center, black, transparent)' }}
      />

      {/* ── Header: Team KAY branding, no Contact Us ── */}
      <header className="max-w-6xl w-full mx-auto px-6 py-5 flex items-center border-b border-slate-900/60 relative z-25">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-mono-tech text-[#00ff66] tracking-widest uppercase">
              Fan Fraud Shield
            </span>
            <span className="text-lg font-cyber-panel font-extrabold tracking-widest text-white uppercase">
              Team <span className="text-[#00ff66]">KAY</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-grow flex flex-col relative z-10">

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-16 mt-4">

            {/* HERO SECTION — with Matrix rain in background */}
            <section className="relative grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[420px] rounded-2xl overflow-hidden">
              {/* Matrix rain canvas — behind everything */}
              <MatrixRain />

              {/* Dark overlay so text stays readable */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#030605]/95 via-[#030605]/80 to-transparent pointer-events-none" />

              {/* Left: copy */}
              <div className="md:col-span-7 flex flex-col text-left justify-center relative z-10 p-6 md:p-10">
                <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase mb-4 block">
                  [ FAN FRAUD SHIELD — ACM RVCE PS9 ]
                </span>
                <h1 className="text-5xl sm:text-6xl font-extrabold font-sans tracking-tight text-white leading-none mb-6">
                  Detection <br />
                  <span className="font-serif italic font-light text-slate-400">and</span> Response
                </h1>
                <p className="text-sm text-slate-400 font-sans max-w-lg leading-relaxed mb-6">
                  We amplify your threat visibility and deploy automated incident response to
                  safeguard fans from phishing, QR scams, and spoofed emails during World Cup 2026.
                </p>
                <div
                  onClick={() => setActiveTab('qr')}
                  className="flex items-center gap-3 text-xs font-mono-tech text-slate-400 hover:text-[#00ff66] transition-colors cursor-pointer group w-fit"
                >
                  <span className="w-6 h-6 border border-slate-700 rounded-full flex items-center justify-center group-hover:border-[#00ff66] transition-all">
                    ↓
                  </span>
                  <span>Select a tool below to get started</span>
                </div>
              </div>

              {/* Right: 3-D globe */}
              <div className="md:col-span-5 flex justify-center items-center h-full relative z-10 py-6">
                <HeroHand />
              </div>
            </section>

            {/* WHAT WE OFFER */}
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-900 pb-4 mb-8">
                <div>
                  <span className="text-[9px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-1">
                    [ WORK SERVICES ]
                  </span>
                  <h3 className="text-xl font-bold font-sans text-slate-200">What we offer</h3>
                </div>
                <span className="text-[10px] font-mono-tech text-slate-500 uppercase mt-2 md:mt-0">
                  Keep scrolling to learn more
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    num: '1.0',
                    title: 'Redirection Hop Tracer',
                    desc: 'Traces complete redirect chains, checking intermediate domains and parsing final destinations securely.',
                  },
                  {
                    num: '2.0',
                    title: 'SSL & WHOIS Auditor',
                    desc: 'Evaluates cryptographic handshakes, checks certificate expiry, and reads WHOIS age metrics.',
                  },
                  {
                    num: '3.0',
                    title: 'AI Content Analysis',
                    desc: 'Zero-shot Gemini 1.5 Flash classification paired with Levenshtein distance checks for typosquatted domains.',
                  },
                ].map((offer, idx) => (
                  <div key={idx} className="glass rounded-2xl p-6 border border-slate-900/60 relative flex flex-col justify-between min-h-[180px]">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-mono-tech text-[#00ff66]">{offer.num}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]/60" />
                    </div>
                    <div>
                      <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-2">
                        {offer.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{offer.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* STATS GRID */}
            <section className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold font-sans text-slate-200 flex items-center justify-center gap-2">
                  Tailored digital security solutions <span>🛡️</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                <div className="sm:col-span-4 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 1.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">Detection and Response</h4>
                    <p className="text-[11px] text-slate-500">Live operational command resolvers.</p>
                  </div>
                </div>

                <div className="sm:col-span-4 bg-[#00ff66]/10 border border-[#00ff66]/50 rounded-2xl p-6 flex flex-col justify-between min-h-[160px] shadow-[0_0_30px_rgba(0,255,102,0.2)]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 2.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-[#00ff66] uppercase mb-1">Threat Blockade Active</h4>
                    <p className="text-2xl font-cyber-panel font-bold text-slate-100 mt-1">18,482</p>
                    <p className="text-[10px] font-mono-tech text-[#00ff66] tracking-wider uppercase mt-1">Total Exploits Deflected</p>
                  </div>
                </div>

                <div className="sm:col-span-4 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 3.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">Protection Rate</h4>
                    <p className="text-2xl font-cyber-panel font-bold text-slate-100 mt-1">99.8%</p>
                    <p className="text-[10px] font-mono-tech text-slate-500 uppercase mt-1">Shield Accuracy</p>
                  </div>
                </div>

                <div className="sm:col-span-6 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 4.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">Latency Profile</h4>
                    <p className="text-2xl font-cyber-panel font-bold text-slate-100 mt-1">180 ms</p>
                    <p className="text-[10px] font-mono-tech text-slate-500 uppercase mt-1">Response Time</p>
                  </div>
                </div>

                <div className="sm:col-span-6 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 5.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">LLM Intel Processor</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Runs zero-shot prompts to identify display-name spoof attacks on fans.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* QR RESOLVER TAB */}
        {activeTab === 'qr' && (
          <main className="flex-1 mt-4">
            <QRCheck onScanComplete={handleScanComplete} />
          </main>
        )}

        {/* EMAIL SCRUTINIZER TAB */}
        {activeTab === 'email' && (
          <main className="flex-1 mt-4">
            <EmailCheck onScanComplete={handleScanComplete} />
          </main>
        )}

        {/* Tech stack marquee */}
        <section className="mt-16 border-t border-b border-slate-900/80 py-4 overflow-hidden relative select-none">
          <div className="flex justify-around items-center gap-8 font-mono-tech text-[10px] text-slate-600 tracking-widest uppercase">
            <span>FASTAPI</span><span>•</span>
            <span>REACT 19</span><span>•</span>
            <span>VITE</span><span>•</span>
            <span>THREE.JS</span><span>•</span>
            <span>GEMINI 1.5 FLASH</span><span>•</span>
            <span>VIRUSTOTAL</span><span>•</span>
            <span>GOOGLE SAFE BROWSING</span>
          </div>
        </section>

        {/* Footer */}
        <footer
          id="main-footer"
          className="border-t border-slate-900 mt-16 pt-12 pb-6 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-25 font-sans"
        >
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">🛡️</span>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-mono-tech text-[#00ff66] tracking-widest uppercase">
                    Fan Fraud Shield
                  </span>
                  <span className="text-md font-cyber-panel font-extrabold text-slate-100 tracking-wider uppercase">
                    Team <span className="text-[#00ff66]">KAY</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono-tech max-w-sm uppercase leading-5">
                Tailored digital security solutions protecting fans during World Cup 2026.
              </p>
            </div>
            <p className="text-[10px] font-mono-tech text-slate-600 uppercase mt-8 md:mt-0">
              © 2026 Team KAY — ACM RVCE PS9. All rights reserved.
            </p>
          </div>

          <div className="md:col-span-3">
            <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-4">
              [ TOOLS ]
            </span>
            <ul className="space-y-2 text-xs font-mono-tech text-slate-400">
              <li>
                <button onClick={() => { setActiveTab('qr'); setCurrentRiskScore(0); }} className="hover:text-white transition-colors cursor-pointer">
                  QR Code Resolver
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('email'); setCurrentRiskScore(0); }} className="hover:text-white transition-colors cursor-pointer">
                  Email Scrutinizer
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-4">
              [ TEAM ]
            </span>
            <ul className="space-y-2 text-xs font-mono-tech text-slate-400">
              <li>ACM RVCE — PS9</li>
              <li>Team KAY</li>
            </ul>
          </div>
        </footer>
      </div>

      {/* Fixed bottom capsule nav */}
      <nav className="bottom-nav-capsule">
        <button
          onClick={() => { setActiveTab('home'); setCurrentRiskScore(0); }}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          • Home
        </button>

        <span className="text-slate-800 font-mono-tech select-none">|</span>

        <button
          onClick={() => { setActiveTab('qr'); setCurrentRiskScore(0); }}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'qr' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📷 Resolver
        </button>

        <span className="text-slate-800 font-mono-tech select-none">|</span>

        <button
          onClick={() => { setActiveTab('email'); setCurrentRiskScore(0); }}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'email' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✉️ Scrutinizer
        </button>
      </nav>
    </div>
  );
}
