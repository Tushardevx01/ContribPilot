import React from 'react';
import { Heart, ExternalLink, Trophy } from 'lucide-react';

export const SponsorsSection: React.FC = () => {
  const partners = [
    {
      name: 'Google Gemini',
      tag: 'AI Foundation',
      desc: 'Gemini 1.5 Pro & Flash provide deep code reasoning with 1M+ token context windows.',
      icon: '✨',
      color: 'border-brand-cyan/40 bg-brand-cyan/[0.03]',
    },
    {
      name: 'Groq',
      tag: 'LPU Speed Inference',
      desc: 'Ultra-fast low-latency LPU failover ensures zero CLI downtime during high-load periods.',
      icon: '⚡',
      color: 'border-brand-orange/40 bg-brand-orange/[0.03]',
    },
    {
      name: 'GitHub',
      tag: 'Ecosystem & APIs',
      desc: 'Direct integration with GitHub REST & GraphQL for automated issue and PR workflows.',
      icon: '🐙',
      color: 'border-slate-500/40 bg-slate-500/[0.03]',
    },
    {
      name: 'Dodo Payments',
      tag: 'Global Billing',
      desc: 'Frictionless checkout infrastructure powering ContribPilot Pro licenses across 140+ countries.',
      icon: '💳',
      color: 'border-brand-pink/40 bg-brand-pink/[0.03]',
    },
  ];

  const sponsorTiers = [
    {
      tier: 'Platinum Backer',
      price: '$250',
      period: '/ month',
      perks: [
        'Logo featured in CLI terminal banner on launch',
        'Top placement on official landing page & README',
        'Direct advisory channel with Sayandeep Pradhan',
        'Custom feature prioritization for your team',
      ],
      highlight: true,
    },
    {
      tier: 'Gold Supporter',
      price: '$100',
      period: '/ month',
      perks: [
        'Logo on ContribPilot web & documentation',
        'Dedicated sponsor badge in CLI credits (/about)',
        'Early beta access to new multi-repo agent tools',
      ],
      highlight: false,
    },
    {
      tier: 'Community Backer',
      price: '$25',
      period: '/ month',
      perks: [
        'Name in README.md Hall of Fame',
        'Special Backer role in ContribPilot discussions',
        'Our eternal gratitude for powering open-source',
      ],
      highlight: false,
    },
  ];

  return (
    <section id="sponsors" className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#06080d]">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-brand-pink/30 text-xs font-semibold text-brand-pink">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Partners & Sponsors</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Backed by the <span className="text-gradient-gemini">Open-Source Community</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            ContribPilot is free and open-source software maintained by Sayandeep Pradhan, supported by technology partners and generous developer sponsors.
          </p>
        </div>

        {/* Technology Ecosystem Grid */}
        <div className="space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 text-center font-bold">
            POWERED BY INDUSTRY-LEADING INFRASTRUCTURE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {partners.map((p, idx) => (
              <div
                key={idx}
                className={`glass-panel p-6 rounded-2xl border ${p.color} space-y-3 glass-panel-hover`}
              >
                <div className="text-2xl">{p.icon}</div>
                <div>
                  <h4 className="text-base font-bold text-white">{p.name}</h4>
                  <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider">
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sponsor Tiers Grid */}
        <div className="space-y-8 pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Support Continuous Development
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Help us keep ContribPilot independent, fast, and free for students and contributors worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sponsorTiers.map((t, idx) => (
              <div
                key={idx}
                className={`glass-panel p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-6 glass-panel-hover ${
                  t.highlight
                    ? 'border-brand-pink/50 bg-gradient-to-b from-brand-pink/10 to-transparent'
                    : 'border-white/10 bg-[#090d16]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-brand-pink font-bold">
                      {t.tier}
                    </span>
                    {t.highlight && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-pink/20 text-brand-pink border border-brand-pink/30">
                        Top Impact
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">{t.price}</span>
                    <span className="text-slate-400 text-xs">{t.period}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                    {t.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-start space-x-2">
                        <Trophy className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href="https://github.com/sponsors/sayandeep0212"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                    t.highlight
                      ? 'bg-brand-pink text-white hover:bg-pink-600 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Sponsor on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
