import React from 'react';
import { GraduationCap, Rocket, Briefcase, ShieldCheck, HeartHandshake, Zap, Target, HelpCircle } from 'lucide-react';

export const WhySection: React.FC = () => {
  return (
    <section id="why" className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#07090e]">
      {/* Background Accent */}
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-brand-pink/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-20">
        {/* Why ContribPilot Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-brand-indigo/30 text-xs font-semibold text-brand-cyan">
            <HelpCircle className="w-3.5 h-3.5 text-brand-pink" />
            <span>The Open Source Mission</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Why ContribPilot Was Built
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Open-source software powers 96% of modern software. Yet over <span className="text-white font-semibold">82% of first-time open-source contribution attempts are abandoned</span> before reaching a mergeable pull request.
          </p>
        </div>

        {/* 3 Pillars: Why, How It Helps, What Makes It Different */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">The Real Problem</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Finding an issue isn’t the hard part. The real blocker is spending 6 hours understanding monorepo conventions, running broken local toolchains, and figuring out what the maintainer actually expects.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-brand-indigo/20 space-y-4 glass-panel-hover bg-brand-indigo/[0.03]">
            <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center text-brand-indigo">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">How ContribPilot Helps</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              ContribPilot acts as your senior staff co-pilot. It maps repository AST, extracts test strategies, verifies bug reproduction, and produces an idiomatic PR that respects maintainer checklists.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-brand-pink/20 space-y-4 glass-panel-hover bg-brand-pink/[0.03]">
            <div className="w-12 h-12 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Zero Server Cost Model</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Unlike SaaS AI wrappers charging $20/month, ContribPilot connects directly to your own Google Gemini API quota (free 15 RPM / 1M TPM). Your tokens and code never touch third-party intermediaries.
            </p>
          </div>
        </div>

        {/* For Whom It Helps (Personas) */}
        <div id="for-whom" className="pt-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Built For <span className="text-gradient-gemini">Every Stage</span> of Developer
            </h3>
            <p className="text-sm sm:text-base text-slate-400">
              Whether you are landing your first commit or maintaining a 50,000-star repository.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Persona 1: Students */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 glass-panel-hover">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Students & Beginners</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Break past the fear of massive codebases. Discover beginner-friendly, unassigned issues with step-by-step guidance on creating your first mergeable PR.
              </p>
              <div className="text-[11px] font-mono text-brand-cyan font-medium pt-2">
                • Learn Git workflow by doing
              </div>
            </div>

            {/* Persona 2: Hackathons & Bounties */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 glass-panel-hover">
              <div className="w-10 h-10 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
                <Rocket className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Hackathon & Bounty Builders</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Need to add a sponsor plugin or integrate a complex SDK in 48 hours? ContribPilot traces repo architecture instantly so you ship faster.
              </p>
              <div className="text-[11px] font-mono text-brand-pink font-medium pt-2">
                • 10x faster library onboarding
              </div>
            </div>

            {/* Persona 3: Senior Engineers */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 glass-panel-hover">
              <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center text-brand-indigo">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Senior & Staff Engineers</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run deep audits on upstream dependencies. Check for hidden secret leaks, dead code, test regressions, and patch upstream bugs directly from CLI.
              </p>
              <div className="text-[11px] font-mono text-brand-indigo font-medium pt-2">
                • Upstream bug triage in seconds
              </div>
            </div>

            {/* Persona 4: Maintainers */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 glass-panel-hover">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Maintainers & DevRel</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stop closing poorly formatted PRs. ContribPilot teaches contributors to follow your CONTRIBUTING.md checklist and include reproduction steps.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 font-medium pt-2">
                • Standardized, mergeable PRs
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
