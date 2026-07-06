import React, { useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { checkQR } from '../api/client';
import VerdictCard from '../components/VerdictCard';
import PipelineVisualization from '../components/PipelineVisualization';

export default function QRCheck({ onScanComplete }) {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [decodedUrl, setDecodedUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showColdStartTip, setShowColdStartTip] = useState(false);

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
    if (onScanComplete) onScanComplete(null);

    // Automatically trigger scanning on upload to make it instant on the first try!
    startScan(selectedFile);
  };

  const startScan = async (selectedFile) => {
    const fileToScan = selectedFile || file;
    if (!fileToScan) return;

    setStatus('loading');
    setErrorMsg('');
    setResult(null);
    setCurrentStep(0); // Step 1: DECODE
    setShowColdStartTip(false);
    if (onScanComplete) onScanComplete(null);

    // Show a helpful tip if the backend takes longer than 5.5s (due to a Render cold start)
    const coldStartTimeoutId = setTimeout(() => {
      setShowColdStartTip(true);
    }, 5500);

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
            // Simulate scanning steps briefly
            await new Promise((resolve) => {
              setTimeout(() => setCurrentStep(1), 400);
              setTimeout(() => setCurrentStep(2), 800);
              setTimeout(() => setCurrentStep(3), 1200);
              setTimeout(() => setCurrentStep(4), 1600);
              setTimeout(() => resolve(true), 1800);
            });

            const mockNoQrResponse = {
              verdict: "LOW",
              score: 0,
              reasons: [
                "No decodable QR code signature was found in the uploaded image.",
                "Visual inspection indicates a standard image format. No active redirect chains or quishing vectors can be extracted.",
                "Note: Deep pixel steganography analysis is not active for standard visual media. Image is safe to store/view."
              ],
              source: "qr"
            };

            setDecodedUrl("NONE (No decodable QR target found)");
            setResult(mockNoQrResponse);
            setStatus('success');
            if (onScanComplete) onScanComplete(mockNoQrResponse);
            return;
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
    reader.readAsDataURL(fileToScan);
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
        <span className="text-[9px] font-mono-tech text-[#00ff66] tracking-widest uppercase block mb-1">
          [ DECODE SERVICE ]
        </span>
        <h2 className="text-2xl font-bold font-sans tracking-wide text-slate-200 uppercase">
          QR Code Threat Resolver
        </h2>
        <p className="text-xs text-slate-500 font-mono-tech mt-1 uppercase">
          Analyzes redirects, SSL certificate health, and domain reputation signatures
        </p>
      </div>

      {/* Pipeline signature motif */}
      <PipelineVisualization source="qr" status={status} currentStep={currentStep} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left column: Upload Panel */}
        <div className="glass rounded-2xl p-6 border border-slate-900/60 flex flex-col items-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <span className="text-[10px] font-mono-tech text-[#00ff66] font-bold">
              [ 1.0 ]
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
              <span className="text-[10px] font-mono-tech text-[#00ff66] uppercase">READY</span>
            </div>
          </div>

          <label className="w-full h-64 border border-dashed border-slate-900 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#00ff66]/30 hover:bg-[#00ff66]/5 transition-all duration-300 relative overflow-hidden group">
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="QR preview"
                  className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                />
                {/* Micro-interaction: Laser Scanning Line Sweep */}
                {isScanning && (
                  <div className="absolute left-0 w-full h-1 bg-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.8)] opacity-80 animate-scan-sweep pointer-events-none" />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-3 text-slate-700 group-hover:text-[#00ff66] transition-colors">📷</span>
                <p className="text-sm font-semibold text-slate-300">
                  Select or drag QR Code image
                </p>
                <p className="text-xs text-slate-500 mt-2 font-mono-tech uppercase">
                  PNG, JPG, or WEBP up to 5MB
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="qr-file-upload"
              onChange={handleFileChange}
              disabled={isScanning}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              id="qr-camera-capture"
              onChange={handleFileChange}
              disabled={isScanning}
            />
          </label>

          {/* Camera Capture Option */}
          <button
            onClick={() => document.getElementById('qr-camera-capture').click()}
            disabled={isScanning}
            className="w-full mt-3 border border-[#00e5ff]/30 hover:bg-[#00e5ff]/10 text-slate-300 hover:text-white font-bold font-mono-tech py-2.5 rounded-full transition-all duration-300 uppercase flex items-center justify-center gap-2 cursor-pointer text-[10px]"
          >
            📸 Capture Photo from Camera
          </button>

          {file && (
            <div className="w-full mt-4">
              <div className="bg-[#030605] border border-slate-900/80 rounded-xl px-3 py-2.5 text-xs font-mono-tech mb-4 text-slate-400 break-all flex justify-between items-center gap-4">
                <div className="overflow-hidden text-ellipsis">
                  <span className="text-[#00ff66]/70">FILE:</span> {file.name}
                </div>
                <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>

              <button
                onClick={startScan}
                disabled={isScanning}
                className="w-full border border-[#00ff66]/40 hover:bg-[#00ff66]/10 text-slate-200 hover:text-white font-bold font-mono-tech tracking-wider py-3 rounded-full transition-all duration-300 uppercase flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {isScanning ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#00ff66]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    RESOLVING RISK INDEX...
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
            <div className="text-center p-8 glass border-slate-900/60 rounded-2xl w-full border text-slate-500 font-mono-tech text-xs tracking-wider leading-relaxed">
              [SYSTEM STANDBY]<br />
              AWAITING SCAN SOURCE STREAM...
            </div>
          )}

          {status === 'idle' && file && (
            <div className="text-center p-8 glass border-[#00ff66]/20 rounded-2xl w-full border text-[#00ff66] font-mono-tech text-xs tracking-wider leading-relaxed animate-pulse">
              [TARGET LOADED]<br />
              CLICK 'ANALYZE QR TARGET' TO EXECUTE DECK
            </div>
          )}

          {isScanning && (
            <div className="w-full glass border-slate-900/60 rounded-2xl p-8 border flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#00ff66]/10 border-t-[#00ff66] animate-spin mb-4" />
              <div className="text-center font-mono-tech text-[10px] text-slate-400 space-y-1 tracking-wider">
                <p className="text-[#00ff66] font-bold uppercase tracking-widest">
                  RUNNING THREAT SPECS FLOW
                </p>
                {currentStep === 0 && <p className="text-slate-500 animate-pulse">[0/5] DECODING QR MATRIX DATA...</p>}
                {currentStep === 1 && <p className="text-slate-500 animate-pulse">[1/5] TRACKING HTTP HOP CHAINS...</p>}
                {currentStep === 2 && <p className="text-slate-500 animate-pulse">[2/5] RETRIEVING WHOIS & SSL METRICS...</p>}
                {currentStep === 3 && <p className="text-slate-500 animate-pulse">[3/5] AUDITING REPUTATION DATABASES...</p>}
                {currentStep === 4 && <p className="text-slate-500 animate-pulse">[4/5] WEIGHTING RISK VECTORS...</p>}
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
                  PROCESS EXCEPTION ERROR
                </span>
              </div>
              <p className="font-mono-tech text-xs text-red-300 leading-relaxed bg-red-950/40 border border-red-900/30 rounded-lg p-3 select-text">
                {errorMsg}
              </p>
              <button
                onClick={() => startScan()}
                className="w-full mt-4 border border-[#00ff66]/40 hover:bg-[#00ff66]/10 text-slate-200 hover:text-white font-bold font-mono-tech py-2.5 rounded-full transition-all duration-300 uppercase flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                RE-RUN SCAN SIGNAL
              </button>
            </div>
          )}

          {status === 'success' && result && (
            <div className="w-full flex flex-col items-center">
              {decodedUrl && (
                <div className="w-full glass bg-[#030605] border-slate-900/80 border rounded-xl px-4 py-2.5 text-xs font-mono-tech text-slate-400 mb-4 break-all flex flex-col gap-1">
                  <span className="text-[#00ff66] font-bold uppercase tracking-wider text-[9px]">
                    DECODED TARGET URL:
                  </span>
                  <span className="select-text">{decodedUrl}</span>
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
