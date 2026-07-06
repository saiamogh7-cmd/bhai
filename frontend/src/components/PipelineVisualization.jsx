import React from 'react';

export default function PipelineVisualization({ source, status, currentStep }) {
  const steps = source === 'qr' 
    ? [
        { label: '1. DECODE', sub: 'Client jsQR' },
        { label: '2. REDIRECTS', sub: 'Hop Tracker' },
        { label: '3. INTEL', sub: 'WHOIS & SSL' },
        { label: '4. REPUTATION', sub: 'Threat Intelligence' },
        { label: '5. VERDICT', sub: 'Risk Analysis' }
      ]
    : [
        { label: '1. PARSE', sub: 'Header Extractor' },
        { label: '2. SPOOF RULES', sub: 'Typo/Prefilter' },
        { label: '3. AI CLASSIFY', sub: 'Gemini Zero-Shot' },
        { label: '4. VERDICT', sub: 'Risk Analysis' }
      ];

  const isLoading = status === 'loading';

  return (
    <div className="w-full glass bg-slate-950/40 rounded-lg p-5 border border-cyan-500/10 mb-8 max-w-3xl mx-auto select-none">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          DETECTION PIPELINE SYSTEM [STATUS: {status.toUpperCase()}]
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-cyan-400 animate-ping' : 'bg-cyan-500/40'}`} />
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider">PIPELINE_FLOW</span>
        </div>
      </div>

      {/* Styled inline keyframes for the pulse and scanning lines */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashflow {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-dashflow {
          stroke-dasharray: 6, 6;
          animation: dashflow 1.5s linear infinite;
        }
        @keyframes cyber-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.6)); }
        }
        .animate-node-pulse {
          animation: cyber-pulse 1.2s infinite ease-in-out;
        }
      `}} />

      {/* Flex container representing the pipeline nodes and connections */}
      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-6 sm:gap-2 relative items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > idx || status === 'success';
          const isActive = currentStep === idx && isLoading;
          // isPending is implicitly handled by the default nodeColor

          let nodeColor = 'bg-slate-900 border-slate-800 text-slate-600';
          let textColor = 'text-slate-500';
          let pulseClass = '';

          if (isCompleted) {
            nodeColor = 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]';
            textColor = 'text-cyan-300';
          } else if (isActive) {
            nodeColor = 'bg-slate-900 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.45)]';
            textColor = 'text-cyan-400 font-bold';
            pulseClass = 'animate-node-pulse';
          }

          return (
            <div key={idx} className="flex flex-row sm:flex-col items-center flex-1 relative z-10 gap-3 sm:gap-0">
              {/* Connector line for mobile (vertical) or desktop (handled below via relative layout) */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-mono text-xs font-bold transition-all duration-300 ${nodeColor} ${pulseClass} sm:mb-2`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              
              <div className="flex flex-col sm:items-center text-left sm:text-center">
                <span className={`text-[10px] font-mono tracking-wider ${textColor}`}>
                  {step.label}
                </span>
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-0.5 hidden sm:inline">
                  {step.sub}
                </span>
              </div>

              {/* Connector Lines between steps (Desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute top-4 left-[60%] w-[80%] h-0.5 pointer-events-none -z-10">
                  <svg className="w-full h-2 overflow-visible">
                    <line
                      x1="0%"
                      y1="2"
                      x2="100%"
                      y2="2"
                      stroke="#1e293b"
                      strokeWidth="2"
                    />
                    {(isCompleted || isActive) && (
                      <line
                        x1="0%"
                        y1="2"
                        x2={isCompleted ? "100%" : "50%"}
                        y2="2"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        className={isLoading ? 'animate-dashflow' : ''}
                        style={{
                          transition: 'x2 0.5s ease-in-out',
                          strokeShadow: '0 0 10px #06b6d4'
                        }}
                      />
                    )}
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
