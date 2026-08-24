import React from 'react';
import SiteHeader from '@/components/SiteHeader';
import Hero from '@/components/Hero';
import AgentDeck from '@/components/AgentDeck';
import MyPipeline from '@/components/MyPipeline';
import PipelineSection from '@/components/PipelineSection';
import ActivityFeed from '@/components/ActivityFeed';
import BriefingSignup from '@/components/BriefingSignup';
import SiteFooter from '@/components/SiteFooter';
import { PipelineProvider } from '@/contexts/PipelineContext';

const AppLayout: React.FC = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PipelineProvider>
      <div className="min-h-screen bg-[#080B12] text-slate-200 antialiased">
        <SiteHeader />
        <main>
          <Hero onPrimary={() => scrollTo('agents')} onSecondary={() => scrollTo('pipeline')} />
          <AgentDeck />
          <MyPipeline />
          <PipelineSection />
          <ActivityFeed />
          <BriefingSignup />
        </main>
        <SiteFooter onNavigate={scrollTo} />
      </div>
    </PipelineProvider>
  );
};

export default AppLayout;
