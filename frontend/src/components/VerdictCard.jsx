import React, { useRef, useState } from 'react';

export default function VerdictCard({ result }) {
  // Hooks must be called unconditionally — before any early returns
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  if (!result) return null;

  const { verdict, score, reasons, source } = result;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  // 1. Determine alert configurations based on risk score thresholds
  let riskLevel = 'LOW';
  if (score >= 60) {
    riskLevel = 'HIGH';
  } else if (score >= 25) {
    riskLevel = 'MEDIUM';
  }

  const isOfficialVerified = reasons && reasons.some(r => r.startsWith("Verified Sender"));

  const config = {
    HIGH: {
      border: 'border-red-500/60 shadow-[0_0_35px_rgba(255,0,60,0.35)] threat-pulse-high bg-red-950/20',
      badge: 'bg-red-950/80 text-red-400 border-red-500/60',
      text: 'text-red-500',
      icon: '🚨',
      marker: '[!]',
      banner: 'CRITICAL THREAT BLOCKADE ACTIVE',
      guidelines: source === 'email' 
        ? 'CRITICAL WARNING: Zero-payload scam signature detected. DO NOT reply to the sender, click any links, or open attachments. IGNORE AND DELETE THIS EMAIL IMMEDIATELY.'
        : 'CRITICAL WARNING: High-risk phishing/malware destination. REPORT this link immediately to security authorities and CLOSE this browser tab.'
    },
    MEDIUM: {
      border: 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-amber-950/10',
      badge: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
      text: 'text-amber-400',
      icon: '⚠️',
      marker: '[?]',
      banner: 'MODERATE EXPOSURE DETECTED',
      guidelines: 'WARNING: Origin shows suspicious attributes. Verify target domain spelling, cert details, and sender validity before performing any operations.'
    },
    LOW: {
      border: 'border-[#00ff66]/40 shadow-[0_0_20px_rgba(0,255,102,0.15)] bg-slate-950/80',
      badge: 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30',
      text: 'text-[#00ff66]',
      icon: '🛡️',
      marker: '[✓]',
      banner: 'SECURITY PROTOCOL SECURED',
      guidelines: 'RECOMMENDATION: Target matches official channels or exhibits clean certificates. Safe to transact/visit.'
    }
  }[riskLevel];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: 'transform 0.15s ease-out, border-color 0.3s ease, box-shadow 0.3s ease',
        willChange: 'transform'
      }}
      className={`glass rounded-xl p-6 ${config.border} border max-w-2xl w-full mx-auto mt-8 cursor-default select-none`}
    >
      {/* Flashing Banner for High/Medium alerts */}
      <div className="mb-4">
        <div className={`text-[10px] font-mono-tech tracking-widest font-bold px-2.5 py-1 text-center border-b uppercase ${
          riskLevel === 'HIGH' 
            ? 'bg-red-950/60 border-red-500/40 text-red-400 animate-pulse'
            : riskLevel === 'MEDIUM'
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
              : 'bg-[#00ff9d]/5 border-[#00ff9d]/10 text-[#00ff9d]/80'
        }`}>
          {config.banner}
        </div>
      </div>

      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="verdict-icon">
            {config.icon}
          </span>
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-cyber-panel">
              VERDICT SYSTEM REPORT
            </h3>
            <p className="text-sm font-mono-tech text-slate-500 uppercase">
              MODULE: {source || 'unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOfficialVerified && (
            <span className="px-2.5 py-1 text-[10px] font-bold font-mono-tech tracking-wider text-[#00c8ff] bg-[#002244]/60 border border-[#0055ff]/40 rounded flex items-center gap-1.5 animate-pulse">
              <span className="text-xs">✔</span> VERIFIED SOURCE
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-bold font-cyber-panel tracking-widest uppercase border rounded-md ${config.badge}`}>
            {verdict} RISK
          </span>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        {/* Technical Circular Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center select-none flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-slate-900"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            {/* Value indicator */}
            <circle
              className={config.text}
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold font-cyber-panel tracking-tighter text-slate-100">
              {score}
            </span>
            <span className="text-[10px] font-mono-tech tracking-widest text-slate-400 uppercase">
              INDEX
            </span>
          </div>
        </div>

        {/* Readout Summary */}
        <div className="flex-1 w-full text-center sm:text-left">
          <h4 className="text-xs font-mono-tech font-bold tracking-wider text-slate-500 uppercase mb-2">
            DETAILED ANALYSIS READOUT
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            The composite security engine evaluated the input indicators and calculated a risk probability score of{' '}
            <strong className="font-mono-tech text-slate-100">{score}%</strong>.
            {verdict === 'HIGH' && ' Critical exploits or reputation blocks triggered warnings. Immediate action required.'}
            {verdict === 'MEDIUM' && ' Moderate caution is advised. System detected typosquats or newer registration age.'}
            {verdict === 'LOW' && ' Clean reputation record, valid SSL certificate, and authentic domain authority matching.'}
          </p>
        </div>
      </div>

      {/* Action Directives / Guidelines */}
      <div className="mb-6">
        <h4 className="text-xs font-mono-tech font-bold tracking-wider text-slate-500 uppercase mb-2 border-b border-slate-800/80 pb-1">
          OPERATIONAL DIRECTIVES
        </h4>
        <div className={`p-3.5 rounded border text-xs font-mono-tech leading-relaxed select-text ${
          riskLevel === 'HIGH'
            ? 'bg-red-950/40 border-red-500/30 text-red-300 animate-pulse'
            : riskLevel === 'MEDIUM'
              ? 'bg-amber-950/20 border-amber-500/20 text-amber-200'
              : 'bg-cyan-950/10 border-[#00ff9d]/20 text-cyan-200'
        }`}>
          {config.guidelines}
        </div>
      </div>

      {/* Analysis Log / Reasons */}
      <div>
        <h4 className="text-xs font-mono-tech font-bold tracking-wider text-slate-500 uppercase mb-3 border-b border-slate-800/80 pb-1">
          ANALYSIS_LOG.TXT
        </h4>
        <ul className="space-y-2.5 font-mono-tech text-xs text-slate-300">
          {reasons && reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-5 select-text">
              <span className={`font-bold select-none ${config.text}`}>
                {config.marker}
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
