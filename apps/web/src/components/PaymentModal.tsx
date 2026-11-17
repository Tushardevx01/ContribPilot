import React, { useState } from 'react';
import { X, CreditCard, Check, Lock, ArrowRight, RefreshCw, Copy } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: 'monthly' | 'yearly';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, defaultPlan = 'yearly' }) => {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(defaultPlan);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const price = plan === 'yearly' ? '$99 / year' : '$12 / month';

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const mockKey = `cp_pro_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      setGeneratedKey(mockKey);
      setIsProcessing(false);
      setIsCompleted(true);
    }, 1500);
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-brand-indigo/30 p-6 sm:p-8 bg-[#090d16] shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-cyan via-brand-indigo to-brand-pink p-[2px] mx-auto shadow-lg">
            <div className="w-full h-full bg-[#090d16] rounded-2xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-brand-pink" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            {isCompleted ? 'ContribPilot Pro Activated!' : 'Upgrade to ContribPilot Pro'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {isCompleted
              ? 'Your payment via Dodo Payments was successful. Pro license is ready.'
              : 'Secure checkout powered by Dodo Payments. Instant activation for your CLI.'}
          </p>
        </div>

        {isCompleted ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs sm:text-sm flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Dodo Payment Verified</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-white bg-emerald-500/30 px-2 py-0.5 rounded">
                  Active Pro
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Plan: <strong className="text-white">{plan === 'yearly' ? 'Annual ($99)' : 'Monthly ($12)'}</strong> • Hosted Gemini 1.5 Pro Enabled
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300">Your Pro License Key:</label>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between font-mono text-xs text-brand-cyan">
                <span>{generatedKey}</span>
                <button
                  onClick={copyKey}
                  className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy license key"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-white">Activate on CLI:</div>
              <p className="text-[11px] text-slate-400 font-mono">
                contribpilot pro --key {generatedKey}
              </p>
              <p className="text-[10px] text-slate-500">
                Or trigger <code className="text-brand-pink">contribpilot audit &lt;repo&gt;</code> to scan for secret leaks!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-colors shadow-lg"
            >
              Start Using Pro in CLI
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="space-y-5">
            {/* Plan Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setPlan('yearly')}
                className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-center ${
                  plan === 'yearly'
                    ? 'border-brand-indigo bg-brand-indigo/20 shadow-md'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-white">Annual (Save 30%)</div>
                <div className="text-lg font-extrabold text-brand-cyan mt-0.5">$99</div>
                <div className="text-[10px] text-slate-400">$8.25 / month</div>
              </div>

              <div
                onClick={() => setPlan('monthly')}
                className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-center ${
                  plan === 'monthly'
                    ? 'border-brand-indigo bg-brand-indigo/20 shadow-md'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-white">Monthly Plan</div>
                <div className="text-lg font-extrabold text-white mt-0.5">$12</div>
                <div className="text-[10px] text-slate-400">Cancel anytime</div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium text-slate-300">Developer Email for License:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-indigo transition-colors"
              />
            </div>

            {/* Dodo Payments Integration Info */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-left text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Dodo Payments Gateway</span>
              </div>
              <p className="text-[11px]">
                Charges will appear as <strong>Dodo Payments • ContribPilot Pro</strong>. Instant refund guarantee within 14 days.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-pink text-white hover:opacity-95 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Contacting Dodo Payments API...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay {price} via Dodo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
