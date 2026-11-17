import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { StorySection } from './components/StorySection';
import { ProductWalkthrough } from './components/ProductWalkthrough';
import { WhySection } from './components/WhySection';
import { InstallSection } from './components/InstallSection';
import { PricingSection } from './components/PricingSection';
import { SponsorsSection } from './components/SponsorsSection';
import { Footer } from './components/Footer';
import { SignInModal } from './components/SignInModal';
import { PaymentModal } from './components/PaymentModal';

export const App: React.FC = () => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleOpenInstall = () => {
    const el = document.getElementById('installation');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenPricing = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenPaymentModal = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans selection:bg-brand-indigo/30 selection:text-white">
      {/* Top Fixed Navbar */}
      <Navbar
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenPricing={handleOpenPricing}
        onOpenInstall={handleOpenInstall}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroSection
          onOpenInstall={handleOpenInstall}
          onOpenPricing={handleOpenPricing}
        />
        <StorySection />
        <ProductWalkthrough />
        <WhySection />
        <InstallSection />
        <PricingSection
          onOpenPaymentModal={handleOpenPaymentModal}
          onOpenInstall={handleOpenInstall}
        />
        <SponsorsSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        defaultPlan={selectedPlan}
      />
    </div>
  );
};

export default App;
