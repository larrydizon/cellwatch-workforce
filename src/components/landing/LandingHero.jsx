import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingHero({ onStartTrial }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_0%,hsl(var(--primary)/0.20),transparent)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-5 py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Field service operations</p>

        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl md:text-7xl">
          Every crew,
          <br />
          every site,
          <br />
          on one clock.
        </h1>

        <p className="mt-7 max-w-xl text-lg text-muted-foreground">
          Cellwatch runs the whole field day — clock-in with GPS, jobs and shifts, pre-start
          forms, timesheets and payroll — so nothing slips between the office and the site.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-12 gap-2 px-7 text-base" onClick={() => onStartTrial('starter')}>
            Start free trial <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
            <a href="#pricing">See plans</a>
          </Button>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">14 days free · No card required · Cancel anytime</p>
      </div>
    </section>
  );
}