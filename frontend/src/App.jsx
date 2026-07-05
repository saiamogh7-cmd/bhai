import React, { useState, useEffect } from 'react';
import QRCheck from './pages/QRCheck';
import EmailCheck from './pages/EmailCheck';
import Hero3D from './components/Hero3D';
import './App.css';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('qr'); // qr | email
  const [currentRiskScore, setCurrentRiskScore] = useState(0);

  // Terminal boot log sequence simulation (~1.5s)
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

  // Handle risk results from child pages to update global overlay styles
  const handleScanComplete = (result) => {
    if (!result) {
      setCurrentRiskScore(0);
    } else {
      setCurrentRiskScore(result.score);
    }
  };

  // Determine state styling classes based on the risk score
  let globalAlertClass = "";
  let isAlertActive = false;

  if (currentRiskScore >= 60) {
    globalAlertClass = "threat-pulse-high border-red-500/60 ring-2 ring-red-500/20";
    isAlertActive = true;
  } else if (currentRiskScore >= 25) {
    globalAlertClass = "border-amber-500/40 shadow-[inset_0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/10";
  } else if (currentRiskScore > 0) {
    globalAlertClass = "border-[#00ff9d]/30 shadow-[inset_0_0_20px_rgba(0,255,157,0.08)]";
  }

  if (booting) {
    return (
      <div className="bg-[#05070A] text-slate-200 min-h-screen flex flex-col justify-center items-center p-6 relative font-mono select-none">
        {/* Scanline element */}
        <div className="scanlines" />
        
        <div className="max-w-xl w-full border border-cyan-500/20 bg-slate-950 p-6 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col relative">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <span className="text-[10px] tracking-widest text-cyan-400 font-bold uppercase">
              BOOT_SEQUENCE.SH
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          {/* Terminal log panel */}
          <div className="h-64 overflow-y-auto text-xs text-cyan-500/90 leading-6 font-mono-tech select-text">
            {bootLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
            <div className="w-2 h-4 bg-cyan-400 inline-block animate-pulse ml-1" />
          </div>

          <button
            onClick={() => setBooting(false)}
            className="mt-6 border border-cyan-500/40 hover:bg-cyan-500/10 active:bg-cyan-500/20 text-cyan-400 font-bold tracking-widest uppercase text-[10px] py-2 rounded-md transition-all duration-200 cursor-pointer self-end"
          >
            Skip Intrusion Boot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#05070A] text-slate-100 min-h-screen relative font-sans flex flex-col transition-all duration-500 ${globalAlertClass}`}>
      {/* Scanline Sweep across the screen */}
      <div className="scanlines scanline-sweep" />

      {/* Global Critical Red Alert Marquee Banner */}
      {currentRiskScore >= 60 && (
        <div className="bg-red-950/90 border-b border-red-500/50 text-red-500 font-mono-tech py-2 text-center text-xs tracking-widest uppercase select-none animate-pulse relative z-50">
          [!!!] WARNING: CRITICAL MALICIOUS THREAT SIGNATURE DETECTED on active channel [!!!]
        </div>
      )}

      {/* Background Cyber Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(0,255,157,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.3)_1px,transparent_1px)] bg-[size:35px_35px]" 
        style={{ maskImage: 'radial-gradient(ellipse at center, black, transparent)' }}
      />

      {/* Main Command Center Wrapper */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-grow flex flex-col relative z-10">
        
        {/* Header / Hero Section */}
        <header className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-slate-900/60 pb-6 mb-8 mt-4">
          {/* Left Hero Specs */}
          <div className="md:col-span-8 flex flex-col justify-center text-left">
            <div className="flex items-center gap-2 mb-2 font-mono-tech text-[9px] tracking-widest text-cyan-500/70">
              <span className={`w-1.5 h-1.5 rounded-full ${isAlertActive ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              <span>
                {isAlertActive ? 'THREAT_INTERDICTION_ENGAGED' : 'SYSTEM_SECURE_SHIELD_ONLINE'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-cyber-panel tracking-wider text-white uppercase select-none glitch">
              FAN FRAUD <span className="text-cyan-400">SHIELD</span>
            </h1>
            
            <p className="text-xs text-slate-500 font-mono-tech mt-2 tracking-widest uppercase">
              ACM RVCE CODE CUP 2026 // CYBERSECURITY PS9 // TEAM KAY
            </p>

            <div className="mt-4 border-l-2 border-cyan-500/40 pl-4 text-xs font-mono-tech text-slate-500 max-w-xl leading-relaxed select-text">
              Intelligent cyber command center protecting World Cup 2026 fans. Evaluates redirect hopping tracks, 
              cryptographic certificates, domain registration details, and Zero-Payload LLM spoofing vectors.
            </div>
          </div>

          {/* Right Hero: Three.js global threat globe */}
          <div className="md:col-span-4 flex justify-center items-center h-full">
            <Hero3D />
          </div>
        </header>

        {/* Live Counters Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'THREATS BLOCKED', value: '18,482', color: 'text-red-500' },
            { label: 'DOMAINS RESOLVED', value: '42,918', color: 'text-cyan-400' },
            { label: 'PROTECTION RATE', value: '99.8%', color: 'text-[#00ff9d]' },
            { label: 'RESPONSE LATENCY', value: '180 ms', color: 'text-cyan-400' }
          ].map((stat, idx) => (
            <div key={idx} className="glass bg-slate-950/40 border border-slate-900/60 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className={`text-xl font-cyber-panel font-bold ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[8px] font-mono-tech text-slate-500 tracking-wider mt-1 text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        {/* Module Tab Navigation */}
        <nav className="flex justify-center mb-8">
          <div className="glass bg-slate-950/60 p-1.5 rounded-lg border border-slate-900/60 flex gap-2">
            <button
              onClick={() => {
                setActiveTab('qr');
                setCurrentRiskScore(0);
              }}
              className={`px-6 py-2.5 rounded-md font-mono-tech text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'border border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>📷</span> QR_RESOLVER
            </button>
            <button
              onClick={() => {
                setActiveTab('email');
                setCurrentRiskScore(0);
              }}
              className={`px-6 py-2.5 rounded-md font-mono-tech text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'border border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>✉️</span> EMAIL_SCRUTINIZER
            </button>
          </div>
        </nav>

        {/* Main Work Area */}
        <main className="flex-1 mb-12">
          {activeTab === 'qr' ? (
            <QRCheck onScanComplete={handleScanComplete} />
          ) : (
            <EmailCheck onScanComplete={handleScanComplete} />
          )}
        </main>

        {/* Features Info Section */}
        <section className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-xs font-mono-tech font-bold tracking-widest text-slate-500 uppercase">
              THREAT INTELLIGENCE HIGHLIGHTS
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Client-Side QR Resolution',
                icon: '🛠️',
                desc: 'Decodes QR code matrices locally inside the browser sandbox using jsQR. Avoids PyZbar system-level dependency restrictions, streamlining production pipelines.'
              },
              {
                title: 'Redirect Tracer & SSL Intel',
                icon: '🛰️',
                desc: 'Traces complete redirect sequences (following shortened links). Audits domain registry age via WHOIS and evaluates cryptographic SSL trust hierarchies.'
              },
              {
                title: 'Zero-Payload Spoof Detection',
                icon: '🧠',
                desc: 'Employs Gemini AI zero-shot classifier alongside typosquat distance checks to block urgent displays name spoofings that slip past normal filters.'
              }
            ].map((feat, idx) => (
              <div key={idx} className="glass glass-hover rounded-xl p-5 border border-slate-900/60 transition-all duration-300">
                <span className="text-2xl block mb-3">{feat.icon}</span>
                <h4 className="text-sm font-cyber-panel text-slate-200 uppercase font-bold mb-2">
                  {feat.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-12 glass bg-slate-950/20 border border-slate-900/60 rounded-xl p-6">
          <div className="text-center mb-6">
            <h3 className="text-xs font-mono-tech font-bold tracking-widest text-slate-500 uppercase">
              CORE OPERATIONAL FLOW
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {[
              { step: '01', title: 'AUDIT INGESTION', desc: 'Scan QR images or paste suspicious email contents into the security deck.' },
              { step: '02', title: 'PIPELINE EVALUATION', desc: 'Deterministics scan WHOIS details, typosquat signatures, and query Gemini APIs.' },
              { step: '03', title: 'DECISION DIRECTIVE', desc: 'Unified Risk Engine calculates risk scores and prints guidelines instantly.' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-4">
                <span className="text-xs font-mono-tech text-cyan-400 border border-cyan-500/30 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                  {item.step}
                </span>
                <h4 className="text-xs font-cyber-panel text-slate-300 font-bold mb-2 uppercase">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack scrolling strip (subtle marquee simulation) */}
        <section className="mb-12 border-t border-b border-slate-900/80 py-4 overflow-hidden relative select-none">
          <div className="flex justify-around items-center gap-8 font-mono-tech text-[10px] text-slate-500/80 tracking-widest uppercase">
            <span>FASTAPI API</span>
            <span>•</span>
            <span>REACT 19</span>
            <span>•</span>
            <span>VITE BUNDLER</span>
            <span>•</span>
            <span>TAILWIND CSS</span>
            <span>•</span>
            <span>THREE.JS ENGINE</span>
            <span>•</span>
            <span>GEMINI 1.5 FLASH</span>
            <span>•</span>
            <span>VIRUSTOTAL V3</span>
            <span>•</span>
            <span>GOOGLE SAFE BROWSING</span>
          </div>
        </section>

        {/* CTA Actions */}
        <section className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="glass bg-[#00ff9d]/5 border border-[#00ff9d]/20 hover:border-[#00ff9d]/60 hover:bg-[#00ff9d]/10 px-8 py-3 rounded-lg font-mono-tech text-xs text-[#00ff9d] font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(0,255,157,0.05)] hover:shadow-[0_0_20px_rgba(0,255,157,0.15)] flex items-center justify-center gap-2"
          >
            📡 View Source Code
          </a>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-900 mt-12 py-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono-tech text-slate-600 uppercase tracking-widest gap-2">
          <span>🛡️ FAN FRAUD SHIELD V1.0.0</span>
          <span>ACM RVCE CODE CUP 2026 // TEAM KAY</span>
        </footer>

      </div>
    </div>
  );
}
