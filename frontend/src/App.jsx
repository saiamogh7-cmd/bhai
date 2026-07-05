import React, { useState, useEffect } from 'react';
import QRCheck from './pages/QRCheck';
import EmailCheck from './pages/EmailCheck';
import Hero3D from './components/Hero3D';
import './App.css';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('home'); // home | qr | email
  const [currentRiskScore, setCurrentRiskScore] = useState(0);

  // Terminal boot logs simulation (~1.5s)
  useEffect(() => {
    if (!booting) return;

    const logs = [
      "SYSTEM DECRYPT SYSTEM: ACM RVCE PS9 (TEAM KAY)",
      "LOADING PYTHON FASTAPI RISK ENGINE V1.0.0...",
      "ESTABLISHING SECURE GOOGLE SAFE BROWING CONNECTIONS...",
      "ESTABLISHING VIRUSTOTAL v3 DOMAIN Intel WEBHOOKS...",
      "BOOTSTRAPPING GEMINI-1.5-FLASH CONTENT CLASSIFIER...",
      "SHIELD INTEGRITY CONFIRMED: LOCAL HOST OK.",
      "ACCESS GRANTED. INITIALIZING COMMAND CENTER COMMANDS..."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setBootLogs((prev) => [...prev, `> ${logs[currentLogIndex]}`]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 300);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [booting]);

  const handleScanComplete = (result) => {
    if (!result) {
      setCurrentRiskScore(0);
    } else {
      setCurrentRiskScore(result.score);
    }
  };

  // Determine threat-pulse alert states
  let globalAlertClass = "";
  let isAlertActive = false;

  if (currentRiskScore >= 60) {
    globalAlertClass = "threat-pulse-high border-red-500/60 ring-2 ring-red-500/20";
    isAlertActive = true;
  } else if (currentRiskScore >= 25) {
    globalAlertClass = "border-amber-500/40 shadow-[inset_0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/10";
  } else if (currentRiskScore > 0) {
    globalAlertClass = "border-[#00ff66]/30 shadow-[inset_0_0_20px_rgba(0,255,102,0.08)]";
  }

  if (booting) {
    return (
      <div className="bg-[#030605] text-slate-200 min-h-screen flex flex-col justify-center items-center p-6 relative font-mono select-none">
        <div className="scanlines" />
        
        <div className="max-w-xl w-full border border-[#00ff66]/20 bg-[#040a08] p-6 rounded-lg shadow-[0_0_30px_rgba(0,255,102,0.12)] flex flex-col relative">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <span className="text-[10px] tracking-widest text-[#00ff66] font-bold uppercase">
              BOOT_SEQUENCE.SH
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
            className="mt-6 border border-[#00ff66]/40 hover:bg-[#00ff66]/10 active:bg-[#00ff66]/20 text-[#00ff66] font-bold tracking-widest uppercase text-[10px] py-2 rounded-md transition-all duration-200 cursor-pointer self-end px-4"
          >
            Skip Intrusion Boot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#030605] text-slate-200 min-h-screen relative font-sans flex flex-col transition-all duration-500 pb-24 ${globalAlertClass}`}>
      <div className="scanlines" />

      {/* Critical Flashing Alert Banner */}
      {currentRiskScore >= 60 && (
        <div className="bg-red-950/90 border-b border-red-500/50 text-red-500 font-mono-tech py-2 text-center text-xs tracking-widest uppercase select-none animate-pulse relative z-50">
          [!!!] WARNING: CRITICAL THREAT SIGNATURE DETECTED ON ACTIVE RESOLVER [!!!]
        </div>
      )}

      {/* Volumetric Green Grid Backlighting */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(0,255,102,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,102,0.3)_1px,transparent_1px)] bg-[size:35px_35px]" 
        style={{ maskImage: 'radial-gradient(ellipse at center, black, transparent)' }}
      />

      {/* DOTDNA Custom Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-900/60 relative z-25">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="text-md font-cyber-panel font-extrabold tracking-wider text-slate-100 uppercase select-none">
            DOT<span className="text-[#00ff66]">DNA</span>
          </span>
        </div>
        
        <button
          onClick={() => {
            const footerEl = document.getElementById('main-footer');
            if (footerEl) footerEl.scrollIntoView({ behavior: 'smooth' });
          }}
          className="border border-[#00ff66]/30 hover:bg-[#00ff66]/10 text-slate-200 font-mono-tech text-xs uppercase px-5 py-2 rounded-full tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer"
        >
          Contact us <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-grow flex flex-col relative z-10">

        {/* 1. HOME TAB (DOTDNA Visual Landing) */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-16 mt-4">
            
            {/* HERO SECTION */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[400px]">
              {/* Left Side: Dynamic Large Typography */}
              <div className="md:col-span-7 flex flex-col text-left justify-center">
                <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase mb-4 block">
                  [ OUR SERVICES ]
                </span>
                
                <h1 className="text-5xl sm:text-6xl font-extrabold font-sans tracking-tight text-white leading-none mb-6">
                  Detection <br />
                  <span className="font-serif italic font-light text-slate-400">and</span> Response
                </h1>

                <p className="text-sm text-slate-500 font-sans max-w-lg leading-relaxed mb-6">
                  We amplify your threat visibility and employ automated incident response to safeguard your resources, standing, and activities targeting fans during World Cup 2026.
                </p>

                <div 
                  onClick={() => setActiveTab('qr')}
                  className="flex items-center gap-3 text-xs font-mono-tech text-slate-400 hover:text-[#00ff66] transition-colors cursor-pointer group"
                >
                  <span className="w-6 h-6 border border-slate-800 rounded-full flex items-center justify-center group-hover:border-[#00ff66] transition-all">↓</span>
                  <span>Scroll or select tabs to resolve threats</span>
                </div>
              </div>

              {/* Right Side: Rotating point cloud globe */}
              <div className="md:col-span-5 flex justify-center items-center h-full">
                <Hero3D />
              </div>
            </section>

            {/* WHAT WE OFFER PANEL (Horizontal cards) */}
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-900 pb-4 mb-8">
                <div>
                  <span className="text-[9px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-1">
                    [ WORK SERVICES ]
                  </span>
                  <h3 className="text-xl font-bold font-sans text-slate-200">
                    What we offer
                  </h3>
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
                    desc: 'Traces complete redirect routes, checking intermediate domains and parsing destination channels securely.'
                  },
                  {
                    num: '2.0',
                    title: 'SSL & WHOIS Auditor',
                    desc: 'Evaluates cryptographic handshakes, checks expiration dates, and reads WHOIS age metrics.'
                  },
                  {
                    num: '3.0',
                    title: 'AI content analysis',
                    desc: 'Zero-shot Gemini 1.5 Flash content classifications paired with Levenshtein distance checks for typosquatted domains.'
                  }
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
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {offer.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TAILORED SOLUTIONS GRID (Grid layout with one glowing card) */}
            <section className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold font-sans text-slate-200 flex items-center justify-center gap-2">
                  Tailored digital security solutions <span>🛡️</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                {/* Card 1 */}
                <div className="sm:col-span-4 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 1.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">Detection and Response</h4>
                    <p className="text-[11px] text-slate-500">Live operational command resolvers.</p>
                  </div>
                </div>

                {/* Card 2: ACTIVE GLOW LIME CARD */}
                <div className="sm:col-span-4 bg-[#00ff66]/10 border border-[#00ff66]/50 rounded-2xl p-6 flex flex-col justify-between min-h-[160px] shadow-[0_0_30px_rgba(0,255,102,0.2)]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 2.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-[#00ff66] uppercase mb-1">Threat Blockade Active</h4>
                    <p className="text-2xl font-cyber-panel font-bold text-slate-100 mt-1">18,482</p>
                    <p className="text-[10px] font-mono-tech text-[#00ff66] tracking-wider uppercase mt-1">TOTAL EXPLOITS DEFLECTED</p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="sm:col-span-4 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 3.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">Protection Rate</h4>
                    <p className="text-2xl font-cyber-panel font-bold text-slate-100 mt-1">99.8%</p>
                    <p className="text-[10px] font-mono-tech text-slate-500 uppercase mt-1">SHIELD ACCURACY</p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="sm:col-span-6 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 4.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">Latency Profile</h4>
                    <p className="text-2xl font-cyber-panel font-bold text-slate-100 mt-1">180 ms</p>
                    <p className="text-[10px] font-mono-tech text-slate-500 uppercase mt-1">RESPONSE TIME</p>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="sm:col-span-6 glass rounded-2xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[10px] font-mono-tech text-[#00ff66]">[ 5.0 ]</span>
                  <div>
                    <h4 className="text-sm font-cyber-panel font-bold text-slate-200 uppercase mb-1">LLM Intel Processor</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Runs zero-shot prompts to identifydisplay-name spoof attacks on fans.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. QR RESOLVER TAB */}
        {activeTab === 'qr' && (
          <main className="flex-1 mt-4">
            <QRCheck onScanComplete={handleScanComplete} />
          </main>
        )}

        {/* 3. EMAIL SCRUTINIZER TAB */}
        {activeTab === 'email' && (
          <main className="flex-1 mt-4">
            <EmailCheck onScanComplete={handleScanComplete} />
          </main>
        )}

        {/* Tech Stack Marquee Strip */}
        <section className="mt-16 border-t border-b border-slate-900/80 py-4 overflow-hidden relative select-none">
          <div className="flex justify-around items-center gap-8 font-mono-tech text-[10px] text-slate-600 tracking-widest uppercase">
            <span>FASTAPI</span>
            <span>•</span>
            <span>REACT 19</span>
            <span>•</span>
            <span>VITE</span>
            <span>•</span>
            <span>THREE.JS</span>
            <span>•</span>
            <span>GEMINI 1.5 FLASH</span>
            <span>•</span>
            <span>VIRUSTOTAL</span>
            <span>•</span>
            <span>GOOGLE SAFE BROWSING</span>
          </div>
        </section>

        {/* DOTDNA Custom Footer */}
        <footer 
          id="main-footer"
          className="border-t border-slate-900 mt-16 pt-12 pb-6 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-25 font-sans"
        >
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🛡️</span>
                <span className="text-md font-cyber-panel font-extrabold text-slate-100 tracking-wider uppercase">
                  DOT<span className="text-[#00ff66]">DNA</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono-tech max-w-sm uppercase leading-5">
                tailored digital security solutions protecting fans during World Cup 2026.
              </p>
            </div>
            <p className="text-[10px] font-mono-tech text-slate-600 uppercase mt-8 md:mt-0">
              © Copyright 2026 Team KAY. All rights reserved.
            </p>
          </div>

          <div className="md:col-span-3">
            <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-4">
              [ RESOLVERS ]
            </span>
            <ul className="space-y-2 text-xs font-mono-tech text-slate-400">
              <li>
                <button onClick={() => { setActiveTab('qr'); setCurrentRiskScore(0); }} className="hover:text-white transition-colors cursor-pointer">
                  Detection and Response
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('email'); setCurrentRiskScore(0); }} className="hover:text-white transition-colors cursor-pointer">
                  Offensive Security
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <span className="text-[10px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-4">
              [ TEAM ]
            </span>
            <ul className="space-y-2 text-xs font-mono-tech text-slate-400">
              <li>ACM RVCE CODE CUP 2026</li>
              <li>TEAM KAY CREDITS</li>
            </ul>
          </div>
        </footer>

      </div>

      {/* Fixed Bottom Capsule Navigation Bar */}
      <nav className="bottom-nav-capsule">
        <button
          onClick={() => {
            setActiveTab('home');
            setCurrentRiskScore(0);
          }}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          • Home
        </button>
        
        <span className="text-slate-800 font-mono-tech select-none">|</span>
        
        <button
          onClick={() => {
            setActiveTab('qr');
            setCurrentRiskScore(0);
          }}
          className={`text-[10px] font-mono-tech font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'qr' ? 'text-[#00ff66]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📷 Resolver
        </button>
        
        <span className="text-slate-800 font-mono-tech select-none">|</span>
        
        <button
          onClick={() => {
            setActiveTab('email');
            setCurrentRiskScore(0);
          }}
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
