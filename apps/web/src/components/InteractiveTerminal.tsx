import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, RefreshCw, Sparkles, Shield, Cpu, ChevronRight } from 'lucide-react';

export const InteractiveTerminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'audit' | 'quota' | 'slash'>('demo');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const command = 'pnpm dlx contribpilot start facebook/react';

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runDemo = () => {
    setIsRunning(true);
    setStep(0);
    const intervals = [300, 1000, 1800, 2600, 3400, 4200];
    intervals.forEach((time, index) => {
      setTimeout(() => {
        setStep(index + 1);
        if (index === intervals.length - 1) {
          setIsRunning(false);
        }
      }, time);
    });
  };

  useEffect(() => {
    runDemo();
  }, [activeTab]);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden bg-[#090d16]/90">
      {/* Terminal Header Bar */}
      <div className="px-4 py-3 bg-[#0c121e] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs font-mono text-slate-400 pl-2 flex items-center space-x-1.5">
            <Terminal className="w-3 h-3 text-brand-cyan" />
            <span>contribpilot — bash — 80x24</span>
          </span>
        </div>

        {/* Action Tabs for live exploration */}
        <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-2.5 py-1 rounded transition-all ${
              activeTab === 'demo' ? 'bg-brand-indigo/30 text-white border border-brand-indigo/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            /start
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-2.5 py-1 rounded transition-all ${
              activeTab === 'audit' ? 'bg-brand-indigo/30 text-white border border-brand-indigo/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            /audit [Pro]
          </button>
          <button
            onClick={() => setActiveTab('quota')}
            className={`px-2.5 py-1 rounded transition-all ${
              activeTab === 'quota' ? 'bg-brand-indigo/30 text-white border border-brand-indigo/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            /quota
          </button>
          <button
            onClick={() => setActiveTab('slash')}
            className={`px-2.5 py-1 rounded transition-all ${
              activeTab === 'slash' ? 'bg-brand-indigo/30 text-white border border-brand-indigo/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            / (Palette)
          </button>
        </div>

        {/* Quick Restart and Copy */}
        <div className="flex items-center space-x-2">
          <button
            onClick={runDemo}
            disabled={isRunning}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Re-run terminal preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-brand-cyan' : ''}`} />
          </button>
          <button
            onClick={copyCommand}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="font-mono">{copied ? 'Copied!' : 'Copy CLI'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-6 font-mono text-xs sm:text-sm text-slate-300 min-h-[380px] space-y-3 leading-relaxed">
        {activeTab === 'demo' && (
          <>
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="text-emerald-400 font-bold">$</span>
              <span className="text-white">contribpilot start facebook/react</span>
            </div>

            {step >= 1 && (
              <div className="p-3 rounded-lg bg-surface-card/60 border border-brand-cyan/20 text-slate-200">
                <div className="flex items-center space-x-2 font-bold text-brand-cyan">
                  <Sparkles className="w-4 h-4 text-brand-pink" />
                  <span>Authenticated via Google OAuth • Personal Gemini Quota: ACTIVE</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Developer: <span className="text-slate-200">Sayandeep Pradhan</span> • Provider: <span className="text-brand-cyan">gemini-1.5-pro</span> (Failover: <span className="text-brand-orange">groq/llama-3.3-70b</span>)
                </div>
              </div>
            )}

            {step >= 2 && (
              <div className="space-y-1">
                <div className="text-brand-cyan flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloned remote context facebook/react (branch: main)</span>
                </div>
                <div className="text-slate-400 pl-5">
                  Parsed AST across 418 source modules • 3 open issues match your contributor persona
                </div>
              </div>
            )}

            {step >= 3 && (
              <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                <div className="text-brand-pink font-semibold flex items-center space-x-1.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Target Issue Selected: #28419 Fix hydration mismatch warning on custom hook mount</span>
                </div>
                <div className="text-slate-400 text-xs">
                  Complexity: <span className="text-emerald-400 font-bold">Level 2 (Good First Issue)</span> • Files impacted: <code className="text-slate-200">packages/react-dom/src/client/ReactDOMComponent.js</code>
                </div>
              </div>
            )}

            {step >= 4 && (
              <div className="space-y-1">
                <div className="text-indigo-400 flex items-center space-x-2">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Gemini Reasoner formulated step-by-step reproduction & fix plan:</span>
                </div>
                <div className="pl-5 text-slate-400 space-y-0.5 text-xs">
                  <div>1. Inject fallback check for pre-rendered attribute nodes during initial reconciliation.</div>
                  <div>2. Update unit test suite in <code className="text-slate-300">__tests__/ReactDOMHydration-test.js</code>.</div>
                  <div>3. Run automated lint & snapshot verification against React monorepo rules.</div>
                </div>
              </div>
            )}

            {step >= 5 && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="font-bold flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Mergeable PR Generated Successfully!</span>
                </div>
                <div className="text-xs text-slate-300">
                  Branch: <code className="text-brand-cyan">fix/hydration-mismatch-warning</code> • PR template, reproduction steps & unit tests injected.
                </div>
                <div className="text-[11px] text-slate-400">
                  Ready to submit: <code className="text-emerald-400">git push origin fix/hydration-mismatch-warning</code>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'audit' && (
          <>
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="text-emerald-400 font-bold">$</span>
              <span className="text-white">contribpilot audit vercel/next.js</span>
            </div>

            {step >= 1 && (
              <div className="p-3 rounded-lg bg-surface-card border border-brand-purple/30 text-slate-200">
                <div className="flex items-center space-x-2 font-bold text-brand-purple">
                  <Shield className="w-4 h-4 text-brand-purple" />
                  <span>ContribPilot Pro Security & Code Health Engine Active</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Scanning commit history, AST dependencies, license compliance & secret leak markers...
                </div>
              </div>
            )}

            {step >= 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                  <div className="text-slate-400 text-[10px] uppercase">Health Score</div>
                  <div className="text-lg font-bold text-emerald-400">98 / 100</div>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                  <div className="text-slate-400 text-[10px] uppercase">Secret Leaks</div>
                  <div className="text-lg font-bold text-emerald-400">0 Found</div>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                  <div className="text-slate-400 text-[10px] uppercase">Maintainer PR Turnaround</div>
                  <div className="text-lg font-bold text-brand-cyan">2.4 Days</div>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                  <div className="text-slate-400 text-[10px] uppercase">Open First-Time Issues</div>
                  <div className="text-lg font-bold text-brand-pink">14 Ready</div>
                </div>
              </div>
            )}

            {step >= 3 && (
              <div className="p-3 rounded bg-black/50 border border-white/10 text-xs space-y-1">
                <div className="text-brand-cyan font-bold">🛡️ Deep Repository Audit Summary:</div>
                <div className="text-slate-300">
                  • 0 High/Critical CVEs detected in package manifests.
                </div>
                <div className="text-slate-300">
                  • Contribution Guide detected: <code className="text-slate-100">CONTRIBUTING.md</code> (Strict PR template enforced).
                </div>
                <div className="text-emerald-400">
                  ✓ Repo is healthy and safe for immediate open-source contribution.
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'quota' && (
          <>
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="text-emerald-400 font-bold">$</span>
              <span className="text-white">contribpilot quota</span>
            </div>

            {step >= 1 && (
              <div className="p-4 rounded-xl bg-surface-card border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-brand-cyan" />
                    <span>Google Gemini 1.5 Pro / Flash Quota</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Active & Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-black/30 border border-white/5 space-y-1">
                    <div className="text-slate-400">Requests Per Minute (RPM)</div>
                    <div className="text-base font-bold text-white">15 RPM <span className="text-slate-500 text-xs font-normal">(Free Tier)</span></div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-cyan h-full w-[20%]" />
                    </div>
                  </div>
                  <div className="p-3 rounded bg-black/30 border border-white/5 space-y-1">
                    <div className="text-slate-400">Tokens Per Minute (TPM)</div>
                    <div className="text-base font-bold text-white">1,000,000 TPM <span className="text-slate-500 text-xs font-normal">(Free Tier)</span></div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-pink h-full w-[12%]" />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-brand-orange" />
                  <span>Automated Groq LPU Failover: <strong className="text-white">Enabled</strong> (Zero-downtime insurance if quota hits 429)</span>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'slash' && (
          <>
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="text-emerald-400 font-bold">$</span>
              <span className="text-white">contribpilot /</span>
            </div>

            {step >= 1 && (
              <div className="p-3 rounded-lg bg-surface-card border border-white/10 space-y-2 text-xs">
                <div className="text-slate-400 font-semibold pb-1 border-b border-white/10">
                  Select a ContribPilot command:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-cyan">/start &lt;repo&gt;</span>
                      <p className="text-[11px] text-slate-400">Ramp up on issue & generate PR</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-pink">/audit &lt;repo&gt;</span>
                      <p className="text-[11px] text-slate-400">Scan repo health & secret leaks</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-400">/quota</span>
                      <p className="text-[11px] text-slate-400">Inspect Gemini & Groq limits</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-400">/pro</span>
                      <p className="text-[11px] text-slate-400">Dodo Payments Pro checkout</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Blinking prompt line */}
        <div className="flex items-center space-x-2 pt-2 text-slate-500">
          <span className="text-brand-pink">contribpilot</span>
          <span className="text-slate-400">on</span>
          <span className="text-brand-cyan">git:(main)</span>
          <span className="animate-pulse">❯</span>
          <span className="w-2 h-4 bg-slate-300 inline-block animate-terminal-cursor" />
        </div>
      </div>
    </div>
  );
};
