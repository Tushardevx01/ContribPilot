import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

export const ProductWalkthrough: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const features = [
    {
      id: 0,
      badge: 'Step 01 • Deep Context',
      title: 'Understands The Codebase First',
      description:
        'ContribPilot performs lightweight AST parsing and dependency graphing across thousands of files. It grasps architectural patterns before suggesting a single line of code.',
      previewTitle: 'AST & Architecture Graph',
      previewContent: {
        summary: 'Target: facebook/react (main)',
        stats: [
          { label: 'Parsed Files', val: '418 TS/JS' },
          { label: 'Entry Points', val: 'ReactDOM / Fiber' },
          { label: 'Test Suite', val: 'Jest + React Test Utils' },
        ],
        codeSnippet: `// AST Graph Extraction
const entry = resolveModule("react-dom/client");
const fiberNode = traceDependencies(entry);
// Match: Hydration reconciliation path identified`,
      },
    },
    {
      id: 1,
      badge: 'Step 02 • Smart Issue Triage',
      title: 'Discovers Real Mergeable Issues',
      description:
        'Filters out stale discussions, duplicate claims, and issues blocked on design debates. Matches beginner-friendly or high-priority tickets to your skill level.',
      previewTitle: 'Issue Triage Engine',
      previewContent: {
        summary: 'Issue #28419 • Fix hydration mismatch warning',
        stats: [
          { label: 'Complexity', val: 'Level 2 (Good First)' },
          { label: 'Status', val: 'Unclaimed / Active' },
          { label: 'Files Impacted', val: '2 files (~18 lines)' },
        ],
        codeSnippet: `// Issue Verification
Issue #28419 verified:
- No active PRs linked
- Maintainer confirmed bug reproduction
- Safe for first-time contributor`,
      },
    },
    {
      id: 2,
      badge: 'Step 03 • Plan & Diff',
      title: 'Generates Maintainer-Ready PRs',
      description:
        'Produces pinpoint diffs accompanied by unit test fixtures and a PR description written directly against the repository’s CONTRIBUTING.md checklist.',
      previewTitle: 'Automated Mergeable Diff',
      previewContent: {
        summary: 'Branch: fix/hydration-mismatch-warning',
        stats: [
          { label: 'Diff Size', val: '+14 / -4 lines' },
          { label: 'Unit Tests', val: '2 Added (Passing)' },
          { label: 'Checklist', val: '100% Compliant' },
        ],
        codeSnippet: `@@ -142,6 +142,10 @@ function reconcileSingleElement(returnFiber, currentFirstChild, newChild) {
+  if (isServerHydration && !hasHydrationMismatch(currentFirstChild)) {
+    return hydrateServerElement(returnFiber, currentFirstChild, newChild);
+  }
   return createFiberFromElement(newChild, returnFiber.mode, lanes);
 }`,
      },
    },
    {
      id: 3,
      badge: 'Step 04 • Pro Security',
      title: 'Audits Security & Secret Leaks',
      description:
        'Pro mode conducts comprehensive secret scanning, token leaks check, and repository health diagnostics to protect maintainers and contributors alike.',
      previewTitle: 'Pro Health & Security Diagnostic',
      previewContent: {
        summary: 'Repository Audit: vercel/next.js',
        stats: [
          { label: 'Security Score', val: '98 / 100' },
          { label: 'Secret Leaks', val: '0 Leaks' },
          { label: 'PR Turnaround', val: '2.4 Days' },
        ],
        codeSnippet: `[AUDIT REPORT]
✓ API Keys & Tokens: Clean (0 exposed credentials)
✓ Security Policy: Present (SECURITY.md verified)
✓ Maintainer Cadence: Active (24 commits this week)
Recommendation: Excellent repository health.`,
      },
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-background">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-brand-indigo/30 text-xs font-semibold text-brand-cyan">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
            <span>Product Walkthrough</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            How ContribPilot Runs, <span className="text-gradient-gemini">24/7</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            From the moment you pick a repo to the moment your PR is merged, ContribPilot removes friction at every step.
          </p>
        </div>

        {/* Split-Screen Interactive Hobbes Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Selectable Features */}
          <div className="lg:col-span-5 space-y-3">
            {features.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveTab(idx)}
                className={`p-6 rounded-2xl cursor-pointer transition-all border ${
                  activeTab === idx
                    ? 'glass-panel border-brand-indigo/50 bg-brand-indigo/10 shadow-xl'
                    : 'glass-panel border-white/5 hover:border-white/20 bg-surface-card/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-brand-cyan font-bold mb-1">
                  {item.badge}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
                  <span>{item.title}</span>
                  {activeTab === idx && <ArrowRight className="w-4 h-4 text-brand-pink" />}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Right Column: Hobbes Style Live Product Preview Window */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl glass-panel border border-white/10 p-6 shadow-2xl bg-[#090d16] space-y-5">
              {/* Top Window Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-slate-400 pl-2">
                    {features[activeTab].previewTitle}
                  </span>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-brand-indigo/20 text-brand-cyan border border-brand-indigo/30">
                  Live Preview
                </span>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-surface-card border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-mono">Current Context</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {features[activeTab].previewContent.summary}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Stat Pillars */}
              <div className="grid grid-cols-3 gap-3">
                {features[activeTab].previewContent.stats.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{s.label}</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-100 font-mono">{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Code Snippet / Diagnostics Box */}
              <div className="rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                <pre>{features[activeTab].previewContent.codeSnippet}</pre>
              </div>

              {/* Footer Meta */}
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/5">
                <span>ContribPilot v0.1.0 • Gemini 1.5 Pro</span>
                <span className="text-brand-cyan">Loopback Auth Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
