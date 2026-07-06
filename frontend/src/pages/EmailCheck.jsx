import React, { useState } from 'react';
import { checkEmail } from '../api/client';
import VerdictCard from '../components/VerdictCard';
import PipelineVisualization from '../components/PipelineVisualization';

export default function EmailCheck({ onScanComplete }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showColdStartTip, setShowColdStartTip] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) return;

    setStatus('loading');
    setErrorMsg('');
    setResult(null);
    setCurrentStep(0); // Step 1: PARSE
    setShowColdStartTip(false);
    if (onScanComplete) onScanComplete(null);

    // Show a helpful tip if the backend takes longer than 5.5s (due to a Render cold start)
    const coldStartTimeoutId = setTimeout(() => {
      setShowColdStartTip(true);
    }, 5500);

    try {
      // Simulate scanning process flow (2.5s duration)
      const runScanSimulation = () => {
        return new Promise((resolve) => {
          setTimeout(() => setCurrentStep(1), 600);  // Spoof Rules
          setTimeout(() => setCurrentStep(2), 1200); // AI Classify
          setTimeout(() => setCurrentStep(3), 2000); // Verdict
          setTimeout(() => resolve(true), 2500);
        });
      };

      // Run simulation and API call concurrently
      const [_, apiResponse] = await Promise.all([
        runScanSimulation(),
        checkEmail(content)
      ]);

      clearTimeout(coldStartTimeoutId);
      setShowColdStartTip(false);
      setResult(apiResponse);
      setStatus('success');
      if (onScanComplete) onScanComplete(apiResponse);
    } catch (err) {
      clearTimeout(coldStartTimeoutId);
      setShowColdStartTip(false);
      console.error(err);
      setStatus('error');
      if (onScanComplete) onScanComplete(null);
      const errMsgLower = (err.message || '').toLowerCase();
      if (err.message.includes('TIMEOUT')) {
        setErrorMsg('SCAN TIMEOUT: Connection timed out. The classification server failed to respond in time.');
      } else if (err.message.includes('RATE_LIMIT')) {
        setErrorMsg('SCAN BLOCKED: API rate limit hit. Too many email content scans requested. Please stand by.');
      } else if (errMsgLower.includes('failed to fetch') || errMsgLower.includes('load failed')) {
        setErrorMsg('CONNECTION FAILURE: Failed to reach the threat assessment backend. Please check that the backend server is running and CORS is configured.');
      } else {
        setErrorMsg(`ANALYSIS ERROR: ${err.message || 'An unexpected error occurred during evaluation.'}`);
      }
    }
  };


  const isScanning = status === 'loading';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Visual sweep animation classes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanSweepInput {
          0% { transform: translateY(0%); }
          50% { transform: translateY(280px); }
          100% { transform: translateY(0%); }
        }
        .animate-scan-sweep-input {
          animation: scanSweepInput 3s ease-in-out infinite;
        }
      `}} />

      <div className="text-center mb-8">
        <span className="text-[9px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-1">
          [ CONTENT AUDIT SERVICE ]
        </span>
        <h2 className="text-2xl font-bold font-sans tracking-wide text-slate-200 uppercase">
          Email Spoof Scrutinizer
        </h2>
        <p className="text-xs text-slate-500 font-mono-tech mt-1 uppercase">
          Parses headers, detects display-name spoofing, typosquats, and audits zero-payload LLM vectors
        </p>
      </div>

      {/* Pipeline signature motif */}
      <PipelineVisualization source="email" status={status} currentStep={currentStep} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left column: Paste Area */}
        <div className="glass rounded-2xl p-6 border border-slate-900/60 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <span className="text-[10px] font-mono-tech text-[#00ff66] font-bold">
              [ 2.0 ]
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
              <span className="text-[10px] font-mono-tech text-[#00ff66] uppercase">READY</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-900 bg-[#030605] mb-4 h-72">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste the raw email header and/or body here. For example:

From: "FIFA Ticket Support" <refunds@fifa-tickets-scam.com>
Subject: Action Required: Claim your Ticket Refund

Dear Fan, please reply to this email immediately...`}
              disabled={isScanning}
              className="w-full h-full p-4 bg-transparent text-slate-200 font-mono-tech text-xs placeholder-slate-700 focus:outline-none focus:border-[#00ff66]/30 resize-none leading-relaxed select-text"
            />
            {/* Micro-interaction: Laser Scanning Line Sweep */}
            {isScanning && (
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.8)] opacity-80 animate-scan-sweep-input pointer-events-none" />
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isScanning || !content.trim()}
            className="w-full border border-[#00ff66]/40 hover:bg-[#00ff66]/10 text-slate-200 hover:text-white font-bold font-mono-tech tracking-wider py-3 rounded-full transition-all duration-300 uppercase flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {isScanning ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#00ff66]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                RUNNING CONTENT CLASSIFIER...
              </>
            ) : (
              'Analyze Email Content'
            )}
          </button>

          {/* Verified Senders Guide */}
          <div className="mt-5 border-t border-slate-900/60 pt-4 text-left">
            <span className="text-[9px] font-mono-tech text-[#00c8ff] tracking-widest uppercase block mb-2.5">
              Verified Official Channels
            </span>
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed mb-3">
              Official World Cup 2026 emails will always originate from one of these certified sender domains and will show a <span className="text-[#00c8ff] font-bold">✔ Verified Badge</span> on successful check:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['fifa.com', 'fifaworldcup.com', 'visa.com', 'qatarairways.com', 'hyundai.com', 'coca-cola.com', 'adidas.com', 'budweiser.com'].map(d => (
                <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#002244]/40 border border-[#0055ff]/20 text-[9px] font-mono-tech text-[#33aaff]">
                  <span className="text-[#00c8ff]">✔</span> {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Results Readout */}
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          {status === 'idle' && !content.trim() && (
            <div className="text-center p-8 glass border-slate-900/60 rounded-2xl w-full border text-slate-500 font-mono-tech text-xs tracking-wider leading-relaxed">
              [SYSTEM STANDBY]<br />
              AWAITING CONTENT DEPLOYMENT...
            </div>
          )}

          {status === 'idle' && content.trim() && (
            <div className="text-center p-8 glass border-[#00ff66]/20 rounded-2xl w-full border text-[#00ff66] font-mono-tech text-xs tracking-wider leading-relaxed animate-pulse">
              [CONTENT DETECTED]<br />
              CLICK 'ANALYZE EMAIL CONTENT' TO AUDIT INPUT
            </div>
          )}

          {isScanning && (
            <div className="w-full glass border-slate-900/60 rounded-2xl p-8 border flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#00ff66]/10 border-t-[#00ff66] animate-spin mb-4" />
              <div className="text-center font-mono-tech text-[10px] text-slate-400 space-y-1 tracking-wider">
                <p className="text-[#00ff66] font-bold uppercase tracking-widest">
                  RUNNING CONTENT DETECTOR LOGIC
                </p>
                {currentStep === 0 && <p className="text-slate-500 animate-pulse">[0/4] EXTRACTING HEADER BLOCKS & BODY...</p>}
                {currentStep === 1 && <p className="text-slate-500 animate-pulse">[1/4] AUDITING ALLOWLISTS & TYPOSQUATS...</p>}
                {currentStep === 2 && <p className="text-slate-500 animate-pulse">[2/4] DISPATCHING TO GEMINI CLASSIFIER...</p>}
                {currentStep === 3 && <p className="text-slate-500 animate-pulse">[3/4] COMPILING RISK FACTORS...</p>}
                {showColdStartTip && (
                  <p className="text-amber-500 font-bold animate-pulse mt-4 text-[9px] uppercase tracking-widest border border-amber-500/20 bg-amber-950/20 px-2.5 py-1.5 rounded">
                    ⚠️ Server cold start: Initializing container (may take up to 30s)...
                  </p>
                )}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full glass border-red-500/30 rounded-2xl p-6 border text-left">
              <div className="flex items-center gap-2.5 text-red-400 border-b border-red-950 pb-2 mb-4">
                <span className="text-lg">⚠️</span>
                <span className="text-xs font-mono-tech font-bold tracking-widest uppercase">
                  PROCESS EXCEPTION REPORT
                </span>
              </div>
              <p className="font-mono-tech text-xs text-red-300 leading-relaxed bg-red-950/40 border border-red-900/30 rounded-lg p-3 select-text">
                {errorMsg}
              </p>
              <button
                onClick={handleAnalyze}
                className="w-full mt-4 border border-[#00ff66]/40 hover:bg-[#00ff66]/10 text-slate-200 hover:text-white font-bold font-mono-tech py-2.5 rounded-full transition-all duration-300 uppercase flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                RE-RUN EVALUATION SIGNAL
              </button>
            </div>
          )}

          {status === 'success' && result && (
            <div className="w-full flex flex-col items-center">
              <VerdictCard result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
