import React, { useState } from 'react';
import { X, Sparkles, Shield, Check, Lock, Cpu, RefreshCw } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [simulatedAccount, setSimulatedAccount] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      setIsSigningIn(false);
      setIsSignedIn(true);
      setSimulatedAccount('developer@gmail.com');
    }, 1400);
  };

  const handleReset = () => {
    setIsSignedIn(false);
    setSimulatedAccount(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 bg-[#090d16] shadow-2xl space-y-6">
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
              <Sparkles className="w-6 h-6 text-brand-cyan" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            {isSignedIn ? 'Google Gemini Quota Connected' : 'Connect Google Gemini'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {isSignedIn
              ? 'Your personal quota is active. All CLI queries will be routed directly through your Google account at $0 cost.'
              : 'Sign in once to unlock free Gemini 1.5 Pro & Flash reasoning directly from your Google Cloud allowance.'}
          </p>
        </div>

        {/* Signed In State */}
        {isSignedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-xs sm:text-sm">{simulatedAccount}</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Quota Active
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Model Engine:</span>
                  <span className="font-mono text-brand-cyan font-semibold">gemini-1.5-pro • gemini-1.5-flash</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">RPM Allowance:</span>
                  <span className="font-mono text-white">15 requests/min (Free Tier)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TPM Allowance:</span>
                  <span className="font-mono text-white">1,000,000 tokens/min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Failover Backup:</span>
                  <span className="font-mono text-brand-orange">Groq LPU Enabled</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-brand-cyan" />
                <span>Next Step: Start CLI on Your Machine</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Run the command below in your local terminal to begin contributing right away:
              </p>
              <div className="p-2.5 rounded bg-black/60 font-mono text-brand-cyan text-xs flex items-center justify-between">
                <span>contribpilot start facebook/react</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleReset}
                className="w-1/3 py-2.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="w-2/3 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-colors shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 rounded-full bg-white text-black hover:bg-slate-100 font-bold text-sm flex items-center justify-center space-x-3 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Connecting to Google OAuth...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Privacy & Direct Quota Details */}
            <div className="space-y-2.5 pt-2 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>100% Free: Uses Google's official free Gemini tier (15 requests/min).</span>
              </div>
              <div className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                <span>Private & Local: Tokens are stored in your OS keychain, not on any server.</span>
              </div>
              <div className="flex items-start space-x-2">
                <Cpu className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Automatic Groq Failover: Zero interruptions when quota resets.</span>
              </div>
            </div>

            {/* Loopback Note for CLI */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-500 text-center font-mono">
              When starting from CLI, your browser opens automatically to authenticate.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
