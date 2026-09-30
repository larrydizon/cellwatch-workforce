import React from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import FeatureGrid from '@/components/landing/FeatureGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingSection from '@/components/landing/PricingSection';
import CtaBand from '@/components/landing/CtaBand';
import LandingFooter from '@/components/landing/LandingFooter';

// Public front door. Renders without a session; signed-in visitors are sent
// straight to the app home instead of seeing marketing content.
export default function Landing() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // The chosen plan rides along to onboarding so it survives the sign-up step.
  const startTrial = (plan) => {
    try {
      localStorage.setItem('signup_plan', plan);
    } catch (e) {
      // private browsing — the URL parameter still carries the plan
    }
    base44.auth.redirectToLogin(`${window.location.origin}/onboarding?plan=${plan}`);
  };

  const signIn = () => base44.auth.redirectToLogin(`${window.location.origin}/dashboard`);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader onStartTrial={startTrial} onSignIn={signIn} />
      <LandingHero onStartTrial={startTrial} />
      <FeatureGrid />
      <HowItWorks />
      <PricingSection onStartTrial={startTrial} />
      <CtaBand onStartTrial={startTrial} />
      <LandingFooter />
    </div>
  );
}