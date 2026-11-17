import React, { useState } from 'react';
import { Check, Sparkles, CreditCard, Lock, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onOpenPaymentModal: (plan: 'monthly' | 'yearly') => void;
  onOpenInstall: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenPaymentModal, onOpenInstall }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <section id="pricing" className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#07090e]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-indigo/10 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-brand-indigo/30 text-xs font-semibold text-brand-cyan">
            <CreditCard className="w-3.5 h-3.5 text-brand-pink" />
            <span>Transparent Pricing • Powered by Dodo Payments</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Simple, Honest, <span className="text-gradient-gemini">Developer-First</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            Start completely free using your personal Google Gemini quota, or upgrade to Pro for enterprise security audits and hosted AI quotas.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center space-x-3 text-xs font-semibold">
            <span className={billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 border border-white/10 relative transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6 bg-brand-cyan' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`flex items-center space-x-1 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Save 30%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Tier 1: Free Forever */}
          <div className="glass-panel rounded-3xl p-8 border border-white/10 flex flex-col justify-between space-y-8 glass-panel-hover bg-[#0b0f19]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Community Tier
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                  Free Forever
                </span>
              </div>

              <div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">$0</span>
                  <span className="text-slate-400 text-sm">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Bring your own Google account. Direct connection to your personal Gemini 1.5 quota.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Connect personal Google Gemini Quota (15 RPM / 1M TPM)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic Groq LPU failover (llama-3.3-70b)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited public repository exploration</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive slash command palette (<code className="text-brand-cyan">/</code>)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AST parsing & maintainer-ready PR templates</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Local credential storage in OS secure keychain</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenInstall}
              className="w-full py-3.5 rounded-full font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center justify-center space-x-2"
            >
              <span>Install Free CLI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tier 2: ContribPilot Pro (Dodo Payments) */}
          <div className="glass-panel rounded-3xl p-8 border-2 border-brand-indigo/60 flex flex-col justify-between space-y-8 glass-panel-hover bg-gradient-to-b from-[#111728] to-[#090d16] relative shadow-2xl">
            {/* Popular Badge */}
            <div className="absolute -top-3.5 right-8">
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-pink text-white shadow-lg">
                Pro Contributor
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-brand-cyan font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                  <span>Dodo Payments Pro</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-indigo/20 text-brand-cyan border border-brand-indigo/30">
                  Instant Activation
                </span>
              </div>

              <div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">
                    {billingCycle === 'yearly' ? '$99' : '$12'}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {billingCycle === 'yearly' ? '/ year ($8.25/mo)' : '/ month'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  For active open-source engineers, staff devs & teams wanting hosted AI and deep security auditing.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center space-x-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span className="text-white">Everything in Free Community Tier</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-brand-pink shrink-0" />
                  <span>Hosted Gemini 1.5 Pro AI Quota (No Google Cloud setup needed)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-brand-pink shrink-0" />
                  <span>Full Repository Health & Security Audit (<code className="text-brand-cyan font-mono">/audit</code>)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-brand-pink shrink-0" />
                  <span>Secret Leak & Exposed Token Detection</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-brand-pink shrink-0" />
                  <span>Deep Code Structure & Architecture Summaries</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-brand-pink shrink-0" />
                  <span>Multi-repo batch issue matching & priority Groq fallback</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenPaymentModal(billingCycle)}
              className="w-full py-3.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-pink text-white hover:opacity-95 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout with Dodo Payments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dodo Payments Trust Note */}
        <div className="max-w-2xl mx-auto text-center space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit encrypted checkout powered by Dodo Payments</span>
          </div>
          <p>
            Supports credit cards, Apple Pay, Google Pay, and localized bank transfers in 140+ countries. Loopback server auto-activates your CLI upon checkout completion.
          </p>
        </div>
      </div>
    </section>
  );
};
