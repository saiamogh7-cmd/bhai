import React, { useState } from 'react';
import QRCheck from './pages/QRCheck';
import EmailCheck from './pages/EmailCheck';
import Hero3D from './components/Hero3D';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('qr'); // qr | email

  return (
    <div className="bg-[#05070A] text-slate-100 min-h-screen relative font-sans flex flex-col">
      {/* Background cyber grid effect (subtle) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,24,38,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.5)_1px,transparent_1px)] bg-[size:30px_30px]" 
        style={{ maskImage: 'radial-gradient(ellipse at center, black, transparent)' }}
      />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col relative z-10">
        
        {/* Header / Hero Section with 3D Component */}
        <header className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-slate-900 pb-6 mb-8 mt-4">
          
          {/* Left Block: Tech Specs and Titles */}
          <div className="md:col-span-8 flex flex-col justify-center text-left">
            {/* System Status Banner */}
            <div className="flex items-center gap-2 mb-2 font-mono text-[9px] tracking-widest text-cyan-500/70">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SYSTEM_ACTIVE // SECURE_SHIELD_ONLINE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-white uppercase select-none">
              FAN FRAUD <span className="text-cyan-400">SHIELD</span>
            </h1>
            
            <p className="text-xs text-slate-400 font-mono mt-2 tracking-widest uppercase">
              ACM RVCE CODE CUP 2026 // CYBERSECURITY PS9 // TEAM KAY
            </p>

            <div className="mt-4 border-l-2 border-cyan-500/40 pl-4 text-xs font-mono text-slate-500 max-w-xl leading-relaxed">
              Real-time scanner built to detect World Cup 2026 phishing, ticketing, parking scams, and spoofed 
              communications targeting fans. Uses client-side QR resolution, full redirect traces, cert verification, 
              and generative AI content classification.
            </div>
          </div>

          {/* Right Block: Three.js slow-rotating wireframe hero */}
          <div className="md:col-span-4 flex justify-center items-center h-full">
            <Hero3D />
          </div>

        </header>

        {/* Hacker Ops Tab Switcher */}
        <nav className="flex justify-center mb-8">
          <div className="glass bg-slate-950/60 p-1.5 rounded-lg border border-slate-900 flex gap-2">
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-6 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'qr'
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'border border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>📷</span> QR_RESOLVER
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
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
        <main className="flex-1">
          {activeTab === 'qr' ? <QRCheck /> : <EmailCheck />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 mt-12 py-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-600 uppercase tracking-widest gap-2">
          <span>🛡️ FAN FRAUD SHIELD V1.0.0</span>
          <span>ACM RVCE CODE CUP 2026 // TEAM KAY</span>
        </footer>

      </div>
    </div>
  );
}
