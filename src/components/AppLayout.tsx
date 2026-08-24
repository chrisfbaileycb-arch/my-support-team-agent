import React, { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Hero from '@/components/Hero';
import ScheduleBar from '@/components/ScheduleBar';
import AgentDeck from '@/components/AgentDeck';
import MyPipeline from '@/components/MyPipeline';
import PipelineSection from '@/components/PipelineSection';
import ActivityFeed from '@/components/ActivityFeed';
import BriefingSignup from '@/components/BriefingSignup';
import SiteFooter from '@/components/SiteFooter';
import CovenantGate from '@/components/CovenantGate';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';

const AppLayout: React.FC = () => {
  const [entered, setEntered] = useState(false);

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


  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!entered) {
    return <CovenantGate onEnter={() => setEntered(true)} />;
  }

  return (
    <ScheduleProvider>
      <PipelineProvider>
        <div className="min-h-screen bg-gradient-to-b from-[#FBFAFF] via-[#F7FBFF] to-[#F6FFFB] text-slate-700 antialiased">
          <SiteHeader />
          <main>
            <Hero onPrimary={() => scrollTo('agents')} onSecondary={() => scrollTo('schedule')} />
            <ScheduleBar />
            <AgentDeck />
            <MyPipeline />
            <PipelineSection />
            <ActivityFeed />
            <BriefingSignup />
          </main>
          <SiteFooter onNavigate={scrollTo} />
        </div>
      </PipelineProvider>
    </ScheduleProvider>
  );
};

export default AppLayout;
