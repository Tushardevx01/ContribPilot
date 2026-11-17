import React from 'react';
import { Clock, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export const StorySection: React.FC = () => {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#07090e]">
      {/* Subtle Atmospheric Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-indigo/10 blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        {/* Hobbes Style High-Contrast Statement Hierarchy */}
        <div className="space-y-6 text-left sm:text-center">
          <p className="text-2xl sm:text-4xl font-light text-slate-300 leading-snug">
            Developers want to contribute <span className="text-white font-medium">before wasting hours</span> on environment setup.
          </p>

          <p className="text-2xl sm:text-4xl font-light text-slate-300 leading-snug">
            Maintainers want PRs that <span className="text-white font-medium">actually follow project guidelines</span>.
          </p>

          <p className="text-2xl sm:text-4xl font-normal text-slate-500 leading-snug">
            Traditional open-source onboarding slows both down.
          </p>

          <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight pt-2">
            <span className="text-gradient-gemini">ContribPilot changes that.</span>
          </p>
        </div>

        {/* 4 Contrast Pain Point vs. ContribPilot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">The Old Way: 4 Hours of Setup</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Clone a 2GB monorepo, wrestle with outdated lockfiles, install 4 global toolchains, only to discover someone else already claimed the issue 2 days ago.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-brand-cyan/20 space-y-3 glass-panel-hover bg-brand-cyan/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">The ContribPilot Way: 3 Minutes</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Run <code className="text-brand-cyan font-mono text-xs">contribpilot start &lt;repo&gt;</code>. AST parsing identifies active unassigned issues, maps affected files, and verifies reproducing logic instantly.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">The Old Way: PR Rejection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Maintainers close your PR without review because you missed their PR template checklist, skipped unit tests, or accidentally modified an unrelated dependency.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 space-y-3 glass-panel-hover bg-emerald-500/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">The ContribPilot Way: Mergeable by Default</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              ContribPilot automatically reads <code className="text-emerald-400 font-mono text-xs">CONTRIBUTING.md</code> and generates a maintainer-ready PR with linked issues, testing evidence, and verified clean git history.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
