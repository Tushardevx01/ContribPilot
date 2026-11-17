import React, { useState } from 'react';
import { Terminal, Copy, Check, ArrowRight, Github, Sparkles, ExternalLink } from 'lucide-react';
import { InteractiveTerminal } from './InteractiveTerminal';

interface HeroSectionProps {
  onOpenInstall: () => void;
  onOpenPricing: () => void;
  onOpenSignIn: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenInstall, onOpenPricing, onOpenSignIn }) => {
  const [copied, setCopied] = useState(false);
  const installCmd = 'npm install -g contribpilot';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Top Announcement Bar (Antigravity style) */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-center">
          <a
            href="#why"
            className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-panel border border-brand-indigo/30 text-xs font-medium text-slate-300 hover:text-white hover:border-brand-indigo/60 transition-all shadow-md group"
          >
            <span className="px-1.5 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold uppercase tracking-wider">
              ✦ NEW
            </span>
            <span>Gemini 1.5 Pro & Groq LPU Failover now in ContribPilot</span>
            <span className="text-slate-500 group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>
      </div>

      {/* Mercury Style Dot Matrix Background Layer */}
      <div className="absolute inset-0 bg-dot-matrix opacity-35 pointer-events-none" />

      {/* Luminous Matrix Spotlight Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] dot-spotlight blur-3xl opacity-70 pointer-events-none" />

      {/* Atmospheric Horizon Light */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-brand-indigo/10 via-brand-cyan/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        {/* Antigravity CLI Split Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Bold Typography & Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-cyan">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <span>ContribPilot CLI • v0.1.0</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              The lightweight, terminal-first surface for <span className="text-gradient-gemini">open-source</span> impact.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Run autonomous contribution agents, execute repository security audits directly, and land mergeable pull requests with automated AST diffs — powered by your personal Google Gemini quota.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenInstall}
                className="px-7 py-3 rounded-full font-bold text-xs sm:text-sm bg-white text-black hover:bg-slate-200 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <Terminal className="w-4 h-4" />
                <span>Install ContribPilot</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenSignIn}
                className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm glass-panel hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-brand-pink" />
                <span>Connect Quota ($0)</span>
              </button>

              <button
                onClick={onOpenPricing}
                className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
              >
                <span>Pro & Dodo Pricing</span>
              </button>
            </div>

            {/* Quick Copy Command */}
            <div className="pt-1 flex items-center space-x-3">
              <div className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-surface-card border border-white/10 font-mono text-xs text-slate-300">
                <span className="text-brand-cyan">$</span>
                <span>{installCmd}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {copied ? 'Copied to clipboard!' : 'Node >= 20'}
              </span>
            </div>

            {/* Developer Mention */}
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400">
              <span>Architected & Maintained by</span>
              <a
                href="https://github.com/sayandeep0212"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-brand-cyan transition-colors underline decoration-brand-indigo/40"
              >
                Sayandeep Pradhan
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://github.com/sayandeep0212/ContribPilot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
              >
                <Github className="w-3.5 h-3.5" />
                <span>sayandeep0212/ContribPilot</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          </div>

          {/* Right Column: Antigravity CLI Window Screenshot/Mockup */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl glass-panel border border-white/15 shadow-2xl overflow-hidden bg-[#090d16]/95">
              {/* Window Header */}
              <div className="px-4 py-3 bg-[#0d1320] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-slate-400 pl-2">contribpilot — zsh</span>
                </div>
                <div className="text-[11px] font-mono text-brand-cyan">Gemini 1.5 Pro Active</div>
              </div>

              {/* Terminal Content (Matching Antigravity CLI Screenshot style) */}
              <div className="p-6 font-mono text-xs sm:text-sm text-slate-300 space-y-4">
                {/* Colorful ASCII Art Logo */}
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-gradient-gemini font-extrabold text-sm sm:text-base leading-tight tracking-wider">
                    {`   ____            _        _ _     ____  _ _       _   `}
                    <br />
                    {`  / ___|___  _ __ | |_ _ __(_) |__ |  _ \\(_) | ___ | |_ `}
                    <br />
                    {` | |   / _ \\| '_ \\| __| '__| | '_ \\| |_) | | |/ _ \\| __|`}
                    <br />
                    {` | |__| (_) | | | | |_| |  | | |_) |  __/| | | (_) | |_ `}
                    <br />
                    {`  \\____\\___/|_| |_|\\__|_|  |_|_.__/|_|   |_|_|\\___/ \\__|`}
                  </div>
                  <div className="text-xs text-slate-400 pt-1">
                    Welcome to <span className="text-white font-bold">ContribPilot CLI</span>!
                  </div>
                </div>

                {/* Simulated CLI flow */}
                <div className="space-y-2 pt-1 border-t border-white/10 text-xs">
                  <div className="text-slate-400 flex items-center space-x-2">
                    <span className="text-brand-pink font-bold">&gt; you:</span>
                    <span className="text-slate-100">contribpilot start facebook/react</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                    <div className="text-brand-cyan font-bold flex items-center space-x-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Target: facebook/react (418 modules parsed)</span>
                    </div>

                    <div className="text-slate-400">
                      ContribPilot: Here&apos;s the mergeable fix for issue #28419:
                    </div>

                    {/* Git Diff Color Highlighting */}
                    <div className="p-2.5 rounded bg-black/80 font-mono text-[11px] space-y-0.5 border border-white/5">
                      <div className="text-slate-500">3  import &quot;react-dom/client&quot;;</div>
                      <div className="text-slate-500">4</div>
                      <div className="text-red-400 bg-red-950/30 px-1 rounded">-  return renderRootSync(fiberRoot, lanes);</div>
                      <div className="text-emerald-400 bg-emerald-950/30 px-1 rounded">+  if (!hasHydrationMismatch(fiberRoot)) &#123;</div>
                      <div className="text-emerald-400 bg-emerald-950/30 px-1 rounded">+    return hydrateElement(fiberRoot, lanes);</div>
                      <div className="text-emerald-400 bg-emerald-950/30 px-1 rounded">+  &#125;</div>
                      <div className="text-slate-500">8</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Unit Tests: <span className="text-emerald-400 font-bold">Passing (3/3)</span></span>
                      <span className="text-brand-pink font-semibold">[PR Ready to Submit]</span>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="flex items-center space-x-2 pt-1 text-slate-500">
                  <span className="text-brand-pink">contribpilot</span>
                  <span className="text-brand-cyan">on git:(fix/hydration)</span>
                  <span className="text-slate-300">❯</span>
                  <span className="w-2 h-4 bg-slate-300 inline-block animate-terminal-cursor" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Terminal Below */}
        <div className="pt-12">
          <div className="text-center space-y-2 pb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Try the Interactive CLI Simulator
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Test commands live in the browser without installing anything.
            </p>
          </div>
          <InteractiveTerminal />
        </div>
      </div>
    </section>
  );
};
