import React, { useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { checkQR } from '../api/client';
import VerdictCard from '../components/VerdictCard';
import PipelineVisualization from '../components/PipelineVisualization';

export default function QRCheck() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [decodedUrl, setDecodedUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Clean up URL object on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
    setDecodedUrl('');
    setResult(null);
    setErrorMsg('');
    setStatus('idle');
    setCurrentStep(0);
  };

  const startScan = async () => {
    if (!file) return;

    setStatus('loading');
    setErrorMsg('');
    setResult(null);
    setCurrentStep(0); // Step 1: DECODE

    // Set up FileReader to parse the image data
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Draw image to canvas to extract raw ImageData
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);

          if (!decoded || !decoded.data) {
            throw new Error('NO_QR: No valid QR code signature detected in the image.');
          }

          const url = decoded.data;
          setDecodedUrl(url);

          // Simulate scanning process flow (2.5s duration)
          const runScanSimulation = () => {
            return new Promise((resolve) => {
              setTimeout(() => setCurrentStep(1), 500); // Hops
              setTimeout(() => setCurrentStep(2), 1000); // SSL/WHOIS
              setTimeout(() => setCurrentStep(3), 1600); // Reputation
              setTimeout(() => setCurrentStep(4), 2200); // Verdict Risk
              setTimeout(() => resolve(true), 2500);
            });
          };

          // Run simulation and API call concurrently
          const [_, apiResponse] = await Promise.all([
            runScanSimulation(),
            checkQR(url)
          ]);

          setResult(apiResponse);
          setStatus('success');
        } catch (err) {
          console.error(err);
          setStatus('error');
          if (err.message.includes('NO_QR')) {
            setErrorMsg('QR DECODE FAILED: Could not locate a QR code signature. Ensure the code is clear and well-lit.');
          } else if (err.message.includes('TIMEOUT')) {
            setErrorMsg('SCAN TIMEOUT: Connection timed out. The target domain failed to resolve or respond in time.');
          } else if (err.message.includes('RATE_LIMIT')) {
            setErrorMsg('SCAN BLOCKED: Rate limit exceeded. Too many requests have been sent. Please stand by before querying.');
          } else {
            setErrorMsg(`ANALYSIS ERROR: ${err.message || 'An unexpected error occurred during evaluation.'}`);
          }
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const isScanning = status === 'loading';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Visual sweep animation classes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanSweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-sweep {
          animation: scanSweep 2s ease-in-out infinite;
        }
      `}} />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-mono tracking-wide text-cyan-400 uppercase">
          QR CODE THREAT RESOLVER
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-1">
          ANALYZES REDIRECTS, SSL CERTIFICATE HEALTH, AND DOMAIN REPUTATION SIGNATURES
        </p>
      </div>

      {/* Pipeline signature motif */}
      <PipelineVisualization source="qr" status={status} currentStep={currentStep} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left column: Upload Panel */}
        <div className="glass rounded-xl p-6 border border-slate-800 flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-[10px] font-mono tracking-widest text-slate-400">
              UPLOAD_QR_STREAM.DAT
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-[10px] font-mono text-cyan-500">READY</span>
            </div>
          </div>

          <label className="w-full h-64 border-2 border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/20 transition-all duration-300 relative overflow-hidden group">
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="QR preview"
                  className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                />
                {/* Micro-interaction: Laser Scanning Line Sweep */}
                {isScanning && (
                  <div className="absolute left-0 w-full h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] opacity-80 animate-scan-sweep pointer-events-none" />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-3 text-slate-600 group-hover:text-cyan-400 transition-colors">📷</span>
                <p className="text-sm font-semibold text-slate-300">
                  Select or drag QR Code image
                </p>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  PNG, JPG, or WEBP up to 5MB
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isScanning}
            />
          </label>

          {file && (
            <div className="w-full mt-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded px-3 py-2 text-xs font-mono mb-4 text-slate-400 break-all flex justify-between items-center gap-4">
                <div className="overflow-hidden text-ellipsis">
                  <span className="text-slate-500">FILE:</span> {file.name}
                </div>
                <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>

              <button
                onClick={startScan}
                disabled={isScanning}
                className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold font-mono tracking-wider py-3 rounded-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Executing Threat Scan...
                  </>
                ) : (
                  'Analyze QR Target'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right column: Results Readout */}
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          {status === 'idle' && !file && (
            <div className="text-center p-8 glass border-slate-800 rounded-xl w-full border text-slate-500 font-mono text-sm leading-relaxed">
              [SYSTEM STANDBY]<br />
              AWAITING SCAN UPLOAD...
            </div>
          )}

          {status === 'idle' && file && (
            <div className="text-center p-8 glass border-cyan-500/20 rounded-xl w-full border text-cyan-400 font-mono text-sm leading-relaxed">
              [TARGET LOADED]<br />
              CLICK 'ANALYZE QR TARGET' TO BEGIN SCAN SEQUENCE
            </div>
          )}

          {isScanning && (
            <div className="w-full glass border-slate-800 rounded-xl p-8 border flex flex-col items-center justify-center">
              {/* Spinner */}
              <div className="w-12 h-12 rounded-full border-4 border-cyan-900 border-t-cyan-400 animate-spin mb-4" />
              <div className="text-center font-mono text-xs text-slate-400 space-y-1">
                <p className="text-cyan-400 font-bold uppercase tracking-widest">
                  RUNNING INTELLIGENCE ALGORITHMS
                </p>
                {currentStep === 0 && <p className="text-slate-500 animate-pulse">[0/5] DECODING QR MATRIX DATA...</p>}
                {currentStep === 1 && <p className="text-slate-500 animate-pulse">[1/5] TRACKING HTTP HOP CHAINS...</p>}
                {currentStep === 2 && <p className="text-slate-500 animate-pulse">[2/5] RETRIEVING WHOIS & SSL METRICS...</p>}
                {currentStep === 3 && <p className="text-slate-500 animate-pulse">[3/5] AUDITING REPUTATION DATABASES...</p>}
                {currentStep === 4 && <p className="text-slate-500 animate-pulse">[4/5] WEIGHTING RISK VECTORS...</p>}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full glass border-red-500/30 rounded-xl p-6 border text-left">
              <div className="flex items-center gap-2.5 text-red-400 border-b border-red-950 pb-2 mb-4">
                <span className="text-lg">⚠️</span>
                <span className="text-xs font-mono font-bold tracking-widest uppercase">
                  CRITICAL PROCESS EXCEPTION
                </span>
              </div>
              <p className="font-mono text-xs text-red-300 leading-relaxed bg-red-950/40 border border-red-900/30 rounded p-3 select-text">
                {errorMsg}
              </p>
              <button
                onClick={startScan}
                className="mt-4 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline block"
              >
                RE-ATTEMPT SCAN SEQUENCE
              </button>
            </div>
          )}

          {status === 'success' && result && (
            <div className="w-full flex flex-col items-center">
              {decodedUrl && (
                <div className="w-full glass bg-slate-950/70 border-slate-800 border rounded-lg px-4 py-2.5 text-xs font-mono text-slate-400 mb-4 break-all flex flex-col gap-1">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider text-[9px]">
                    DECODED TARGET URL:
                  </span>
                  <span>{decodedUrl}</span>
                </div>
              )}
              <VerdictCard result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
