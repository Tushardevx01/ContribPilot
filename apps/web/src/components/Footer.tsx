import React from 'react';
import { Terminal, Github, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-white/10 bg-[#05070c] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-cyan via-brand-indigo to-brand-pink flex items-center justify-center p-[2px]">
                <div className="w-full h-full bg-[#090d16] rounded-full flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-brand-cyan" />
                </div>
              </div>
              <span className="font-extrabold text-lg text-white font-mono">ContribPilot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-indigo/20 text-brand-cyan border border-brand-indigo/30">
                v0.1.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-driven open-source copilot that empowers developers to find, diagnose, and land mergeable pull requests with zero environment friction.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
              <span>Maintained by</span>
              <a
                href="https://github.com/sayandeep0212"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-bold hover:text-brand-cyan transition-colors underline decoration-brand-indigo/40"
              >
                Sayandeep Pradhan
              </a>
            </div>
          </div>

          {/* Quick Nav Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-3">
              <div className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Product</div>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#why" className="hover:text-white transition-colors">Why ContribPilot</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#for-whom" className="hover:text-white transition-colors">For Whom</a></li>
                <li><a href="#installation" className="hover:text-white transition-colors">Installation Guide</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Dodo</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Resources</div>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a
                    href="https://github.com/sayandeep0212/ContribPilot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>GitHub Repo</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/sayandeep0212/ContribPilot/blob/main/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/sayandeep0212/ContribPilot/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Issue Tracker</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/sponsors/sayandeep0212"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>GitHub Sponsors</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Ecosystem</div>
              <ul className="space-y-2 text-slate-400">
                <li><span className="text-slate-300">Google Gemini 1.5</span></li>
                <li><span className="text-slate-300">Groq LPU Failover</span></li>
                <li><span className="text-slate-300">Dodo Payments Pro</span></li>
                <li><span className="text-slate-300">Apache-2.0 License</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} ContribPilot. All rights reserved.</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span>Crafted by</span>
              <a
                href="https://github.com/sayandeep0212"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white font-semibold transition-colors"
              >
                Sayandeep Pradhan
              </a>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/sayandeep0212/ContribPilot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1.5"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
