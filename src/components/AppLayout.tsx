import React, { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Hero from '@/components/Hero';
import ScheduleBar from '@/components/ScheduleBar';
import AgentDeck from '@/components/AgentDeck';
import RunHistory from '@/components/RunHistory';
import MyPipeline from '@/components/MyPipeline';
import { GoogleWorkspacePanel } from '@/components/GoogleWorkspacePanel';
import { IntermediateDashboard } from '@/components/IntermediateDashboard';
import { BridgeIntermediaryModal } from '@/components/BridgeIntermediaryModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PipelineSection from '@/components/PipelineSection';
import ActivityFeed from '@/components/ActivityFeed';
import BriefingSignup from '@/components/BriefingSignup';
import SiteFooter from '@/components/SiteFooter';
import CovenantGate from '@/components/CovenantGate';
import { useAuth } from '@/contexts/AuthContext';

const AppLayout: React.FC = () => {
  const { profile, user, loading, acceptCovenant } = useAuth();
  const [entered, setEntered] = useState(false);
  const [bridgeModalOpen, setBridgeModalOpen] = useState(false);

  useEffect(() => {
    // This platform is intentionally light and pastel — never inherit a stale dark theme.
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    try {
      window.localStorage.setItem('theme', 'light');
      if (window.localStorage.getItem('myf_covenant')) setEntered(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  // A signed-in member who has already accepted the covenant never sees the gate again,
  // on any device — the acceptance lives on their account row.
  useEffect(() => {
    if (profile?.covenant_accepted_at) setEntered(true);
  }, [profile?.covenant_accepted_at]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEnter = () => {
    setEntered(true);
    if (user && !profile?.covenant_accepted_at) acceptCovenant();
  };

  if (loading && !entered) {
    return <div className="min-h-screen bg-gradient-to-b from-rose-50 via-sky-50 to-emerald-50" />;
  }

  if (!entered) {
    return <CovenantGate onEnter={handleEnter} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBFAFF] via-[#F7FBFF] to-[#F6FFFB] text-slate-700 antialiased">
      <SiteHeader onOpenBridge={() => setBridgeModalOpen(true)} />
      <main>
        <Hero onPrimary={() => scrollTo('agents')} onSecondary={() => scrollTo('schedule')} />
        
        <ErrorBoundary fallbackTitle="Intermediary Dashboard Boundary" fallbackMessage="The intermediary connection is safely isolated.">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <IntermediateDashboard />
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Schedule Bar Boundary">
          <ScheduleBar />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Agent Deck Boundary">
          <AgentDeck />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Run History Boundary">
          <RunHistory />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Pipeline Tracker Boundary">
          <MyPipeline />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Google Workspace Sync Boundary">
          <GoogleWorkspacePanel />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Live Signals Boundary">
          <PipelineSection />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Activity Feed Boundary">
          <ActivityFeed />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Daily Briefing Boundary">
          <BriefingSignup />
        </ErrorBoundary>
      </main>
      
      <SiteFooter onNavigate={scrollTo} />
      <BridgeIntermediaryModal open={bridgeModalOpen} onClose={() => setBridgeModalOpen(false)} />
    </div>
  );
};

export default AppLayout;
