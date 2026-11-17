import React from 'react';
import { Terminal, Github, Sparkles, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenSignIn: () => void;
  onOpenPricing: () => void;
  onOpenInstall: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSignIn, onOpenPricing, onOpenInstall }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-full px-5 py-3 flex items-center justify-between shadow-2xl border border-white/10 bg-surface/80 backdrop-blur-xl">
          {/* Logo */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-cyan via-brand-indigo to-brand-pink flex items-center justify-center p-[2px] shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090d16] rounded-full flex items-center justify-center">
                <Terminal className="w-4 h-4 text-brand-cyan group-hover:text-brand-pink transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white font-mono">ContribPilot</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-indigo/20 text-brand-cyan border border-brand-indigo/30">
                  v0.1.0
                </span>
              </div>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs lg:text-sm font-medium text-slate-300">
            <a href="#why" className="hover:text-white transition-colors">
              Why ContribPilot
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#for-whom" className="hover:text-white transition-colors">
              For Whom
            </a>
            <a href="#installation" className="hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); onOpenInstall(); }}>
              Installation
            </a>
            <a href="#pricing" className="hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); onOpenPricing(); }}>
              Pricing
            </a>
            <a href="#sponsors" className="hover:text-white transition-colors">
              Sponsors
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Developer Attribution Link */}
            <a
              href="https://github.com/sayandeep0212"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title="Built by Sayandeep Pradhan"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Sayandeep Pradhan</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            {/* Sign In / Connect Gemini */}
            <button
              onClick={onOpenSignIn}
              className="hidden lg:flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
              <span>Connect Gemini</span>
            </button>

            {/* Install CLI CTA Pill */}
            <button
              onClick={onOpenInstall}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center space-x-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Install CLI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
