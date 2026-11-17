import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles } from 'lucide-react';

export const InstallSection: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<'npm' | 'pnpm' | 'npx' | 'mac' | 'windows' | 'linux'>('npm');
  const [copied, setCopied] = useState(false);

  const commands: Record<string, string> = {
    npm: 'npm install -g contribpilot',
    pnpm: 'pnpm dlx contribpilot start facebook/react',
    npx: 'npx contribpilot start shadcn-ui/ui',
    mac: 'brew tap sayandeep0212/tap && brew install contribpilot',
    windows: 'iwr -useb https://contribpilot.dev/install.ps1 | iex',
    linux: 'curl -fsSL https://contribpilot.dev/install.sh | bash',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(commands[activePlatform]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slashCommands = [
    { cmd: '/start <repo>', desc: 'Clone context, triage issues & guide mergeable PR' },
    { cmd: '/audit <repo>', desc: 'Scan repository health, secret leaks & vulnerability score (Pro)' },
    { cmd: '/quota', desc: 'Inspect Google Gemini RPM/TPM quota & Groq failover status' },
    { cmd: '/level', desc: 'Set contributor experience (beginner, intermediate, advanced)' },
    { cmd: '/agents', desc: 'Detect existing CLI AI coding agents on your device' },
    { cmd: '/pro', desc: 'Activate ContribPilot Pro via Dodo Payments' },
    { cmd: '/doctor', desc: 'Run environment diagnostic (Node, Git, Tokens, Keychain)' },
    { cmd: '/logout', desc: 'Clear local session credentials safely' },
  ];

  return (
    <section id="installation" className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#06080d]">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-brand-indigo/30 text-xs font-semibold text-brand-cyan">
            <Terminal className="w-3.5 h-3.5 text-brand-pink" />
            <span>Installation & Setup</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Get Started in <span className="text-gradient-gemini">30 Seconds</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
            Zero complex configuration. Works cross-platform on macOS, Linux, and Windows.
          </p>
        </div>

        {/* Installation Terminal Box */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#090d16]">
          {/* Platform Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 p-3 bg-black/40 gap-2">
            <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
              {(['npm', 'pnpm', 'npx', 'mac', 'windows', 'linux'] as const).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setActivePlatform(plat)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activePlatform === plat
                      ? 'bg-brand-indigo/40 text-white font-bold border border-brand-indigo/50 shadow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {plat === 'mac' ? 'macOS (brew)' : plat === 'windows' ? 'Windows (pwsh)' : plat === 'linux' ? 'Linux (curl)' : plat}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Command!' : 'Copy'}</span>
            </button>
          </div>

          {/* Command Display */}
          <div className="p-6 font-mono text-sm sm:text-base text-slate-200 flex items-center justify-between overflow-x-auto">
            <div className="flex items-center space-x-3">
              <span className="text-brand-pink font-bold">$</span>
              <span className="text-white">{commands[activePlatform]}</span>
            </div>
          </div>
        </div>

        {/* 3 Step Quickstart Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-base font-bold text-white">Sign In with Google</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              contribpilot login
            </p>
            <p className="text-xs text-slate-400">
              Opens your browser to link your personal Google Gemini API quota for $0.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-brand-indigo/20 space-y-2 bg-brand-indigo/[0.02]">
            <div className="w-8 h-8 rounded-full bg-brand-indigo/20 text-brand-indigo flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-base font-bold text-white">Pick Any Repository</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              contribpilot start facebook/react
            </p>
            <p className="text-xs text-slate-400">
              Or use shorthand like <code className="text-brand-cyan">shadcn-ui/ui</code>. ContribPilot parses issues and AST automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-brand-pink/20 space-y-2 bg-brand-pink/[0.02]">
            <div className="w-8 h-8 rounded-full bg-brand-pink/20 text-brand-pink flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-base font-bold text-white">Merge Your First PR</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              git push origin fix/hydration
            </p>
            <p className="text-xs text-slate-400">
              Push your branch and submit the maintainer-ready PR generated by ContribPilot.
            </p>
          </div>
        </div>

        {/* Slash Command Palette Cheatsheet */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-pink" />
                <span>Interactive Slash Command Palette</span>
              </h3>
              <p className="text-xs text-slate-400">Type <code className="text-brand-cyan font-mono">/</code> in any ContribPilot prompt to open the fuzzy search palette</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-black/40 text-slate-300 border border-white/10">
              Press Tab to Autocomplete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {slashCommands.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between space-y-1 hover:border-white/20 transition-colors">
                <span className="font-bold text-brand-cyan">{item.cmd}</span>
                <span className="text-[11px] text-slate-400 font-sans">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
