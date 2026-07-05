import React, { useRef, useState } from 'react';

export default function VerdictCard({ result }) {
  if (!result) return null;

  const { verdict, score, reasons, source } = result;
  
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Cap tilt angle at 8 degrees
    const rotateX = ((centerY - y) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  // Color mappings based on risk verdict
  const config = {
    HIGH: {
      border: 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.25)] animate-pulse',
      badge: 'bg-red-950/80 text-red-400 border-red-500/50',
      text: 'text-red-400',
      glow: 'rgba(239, 68, 68, 0.4)',
      icon: '🚨',
      marker: '[!]'
    },
    MEDIUM: {
      border: 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      badge: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
      text: 'text-amber-400',
      glow: 'rgba(245, 158, 11, 0.3)',
      icon: '⚠️',
      marker: '[?]'
    },
    LOW: {
      border: 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      badge: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40',
      text: 'text-cyan-400',
      glow: 'rgba(6, 182, 212, 0.25)',
      icon: '🛡️',
      marker: '[✓]'
    }
  }[verdict] || {
    border: 'border-slate-700 shadow-lg',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    text: 'text-slate-400',
    glow: 'rgba(255, 255, 255, 0.1)',
    icon: 'ℹ️',
    marker: '[-]'
  };

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
      className={`glass rounded-xl p-6 ${config.border} border max-w-2xl w-full mx-auto mt-8 cursor-default`}
    >
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="verdict-icon">
            {config.icon}
          </span>
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">
              VERDICT SYSTEM REPORT
            </h3>
            <p className="text-sm font-mono text-slate-500 uppercase">
              MODULE: {source || 'unknown'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-bold font-mono tracking-widest uppercase border rounded-md ${config.badge}`}>
          {verdict} RISK
        </span>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        {/* Technical Circular Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center select-none flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-slate-800"
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
            <span className="text-3xl font-extrabold font-mono tracking-tighter text-slate-100">
              {score}
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              INDEX
            </span>
          </div>
        </div>

        {/* Readout Summary */}
        <div className="flex-1 w-full text-center sm:text-left">
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase mb-2">
            DETAILED ANALYSIS READOUT
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            The composite security engine evaluated the input indicators and calculated a risk probability score of{' '}
            <strong className="font-mono text-slate-100">{score}%</strong>.
            {verdict === 'HIGH' && ' Immediate caution is advised. Elements in the pipeline exhibit known fraudulent behaviors.'}
            {verdict === 'MEDIUM' && ' Moderate warning indicators are flagged. Validate origin channels before proceeding.'}
            {verdict === 'LOW' && ' No spoofing signatures or blacklisted reputations were detected. Safe to proceed.'}
          </p>
        </div>
      </div>

      {/* Analysis Log / Reasons */}
      <div>
        <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase mb-3 border-b border-slate-800 pb-1">
          ANALYSIS_LOG.TXT
        </h4>
        <ul className="space-y-2.5 font-mono text-xs text-slate-300">
          {reasons && reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-5">
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
