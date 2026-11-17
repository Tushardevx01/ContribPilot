import React, { useState } from 'react';
import { Terminal, Copy, Check, ArrowRight, Github, Sparkles } from 'lucide-react';
import { InteractiveTerminal } from './InteractiveTerminal';

interface HeroSectionProps {
  onOpenInstall: () => void;
  onOpenPricing: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenInstall, onOpenPricing }) => {
  const [copied, setCopied] = useState(false);
  const installCmd = 'npm install -g contribpilot';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col justify-center">
      {/* Mercury Style Dot Matrix Background Layer */}
      <div className="absolute inset-0 bg-dot-matrix opacity-40 pointer-events-none" />

      {/* Luminous Matrix Spotlight Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] dot-spotlight blur-3xl opacity-70 pointer-events-none" />

      {/* Atmospheric Horizon Light Bar */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-indigo/10 via-brand-cyan/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center relative z-10 space-y-8">
        {/* Top Eyebrow Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-panel border border-brand-indigo/30 shadow-lg text-xs font-semibold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-gradient-gemini font-bold">ContribPilot 2.0</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Bring Your Own Google Gemini Quota ($0 Setup)</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            From Issue to <span className="text-gradient-gemini">Mergeable PR</span> in Minutes
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            AI-driven open-source copilot that clones context, diagnoses codebases, drafts maintainer-ready PRs, and audits repository security. Powered by your personal Google Gemini quota with automated Groq failover.
          </p>
        </div>

        {/* CTA Button Row + Quick Copy Widget */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {/* Primary Pill Button */}
          <button
            onClick={onOpenInstall}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm bg-white text-black hover:bg-slate-200 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <Terminal className="w-4 h-4" />
            <span>Install ContribPilot</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Copy Command Box */}
          <div className="w-full sm:w-auto flex items-center justify-between space-x-3 px-4 py-2.5 rounded-full bg-surface-card border border-white/10 text-xs font-mono text-slate-300 hover:border-brand-indigo/40 transition-colors">
            <span className="text-brand-cyan">$</span>
            <span>{installCmd}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Copy install command"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Pricing CTA */}
          <button
            onClick={onOpenPricing}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full font-semibold text-sm glass-panel hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-brand-pink" />
            <span>View Pro & Dodo Pricing</span>
          </button>
        </div>

        {/* Developer Attribution Highlight */}
        <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <span>Engineered by</span>
          <a
            href="https://github.com/sayandeep0212"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-200 font-semibold hover:text-brand-cyan transition-colors underline decoration-brand-indigo/40 hover:decoration-brand-cyan"
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
          </a>
        </div>

        {/* Embedded Interactive Terminal Showcase */}
        <div className="pt-8">
          <InteractiveTerminal />
        </div>

        {/* Trusted Open Source Ticker */}
        <div className="pt-12 pb-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-500">
            ENGINEERED TO WORK OUT-OF-THE-BOX WITH MAJOR ECOSYSTEMS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-slate-400 text-xs font-mono font-medium opacity-80">
            <span className="hover:text-white transition-colors">⚛️ React</span>
            <span className="hover:text-white transition-colors">▲ Next.js</span>
            <span className="hover:text-white transition-colors">⚡ Vite</span>
            <span className="hover:text-white transition-colors">🎨 Tailwind CSS</span>
            <span className="hover:text-white transition-colors">🟢 Node.js</span>
            <span className="hover:text-white transition-colors">🐍 Python</span>
            <span className="hover:text-white transition-colors">🦀 Rust</span>
          </div>
        </div>
      </div>
    </section>
  );
};
